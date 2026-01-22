defmodule RightTask.Yjs.RoomServer do
  use GenServer
  require Logger

  defstruct [:room_id, :y_doc_state, :connections, :last_activity]

  ## Client API

  def start_link(room_id) do
    GenServer.start_link(__MODULE__, room_id, name: via_tuple(room_id))
  end

  def get_state(room_id) do
    GenServer.call(via_tuple(room_id), :get_state)
  end

  def apply_update(room_id, update_binary) do
    GenServer.cast(via_tuple(room_id), {:apply_update, update_binary})
  end

  def add_connection(room_id, channel_pid, user_id) do
    GenServer.cast(via_tuple(room_id), {:add_connection, channel_pid, user_id})
  end

  def remove_connection(room_id, channel_pid) do
    GenServer.cast(via_tuple(room_id), {:remove_connection, channel_pid})
  end

  ## GenServer Callbacks

  @impl true
  def init(room_id) do
    Logger.info("🏠 Created room: #{room_id}")

    state = %__MODULE__{
      room_id: room_id,
      y_doc_state: <<>>,
      connections: MapSet.new(),
      last_activity: DateTime.utc_now(),
    }

    {:ok, state}
  end

  @impl true
  def handle_call(:get_state, _from, state) do
    {:reply, state.y_doc_state, %{state | last_activity: DateTime.utc_now()}}
  end

  @impl true
  def handle_cast({:apply_update, update_binary}, state) do
    # Store binary update (Yjs handles merging client-side)
    new_state = %{state |
      y_doc_state: state.y_doc_state <> update_binary,
      last_activity: DateTime.utc_now()
    }
    {:noreply, new_state}
  end

  @impl true
  def handle_cast({:add_connection, channel_pid, user_id}, state) do
    Process.monitor(channel_pid)
    connections = MapSet.put(state.connections, {channel_pid, user_id})

    Logger.info("👥 User #{user_id} joined room #{state.room_id} (#{MapSet.size(connections)} total)")

    {:noreply, %{state | connections: connections, last_activity: DateTime.utc_now()}}
  end

  @impl true
  def handle_cast({:remove_connection, channel_pid}, state) do
    connections = Enum.reject(state.connections, fn {pid, _} -> pid == channel_pid end)
                  |> MapSet.new()

    Logger.info("👋 Connection left room #{state.room_id} (#{MapSet.size(connections)} remaining)")

    # Shutdown if empty (cleanup after 1 minute)
    if MapSet.size(connections) == 0 do
      Process.send_after(self(), :shutdown_if_empty, :timer.minutes(1))
    end

    {:noreply, %{state | connections: connections}}
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    handle_cast({:remove_connection, pid}, state)
  end

  @impl true
  def handle_info(:shutdown_if_empty, state) do
    if MapSet.size(state.connections) == 0 do
      Logger.info("🧹 Shutting down empty room: #{state.room_id}")
      {:stop, :normal, state}
    else
      {:noreply, state}
    end
  end

  ## Private

  defp via_tuple(room_id) do
    {:via, Registry, {RightTask.Yjs.RoomRegistry, room_id}}
  end
end
