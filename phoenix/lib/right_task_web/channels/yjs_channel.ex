defmodule RightTaskWeb.YjsChannel do
  use RightTaskWeb, :channel
  alias RightTask.Yjs.{RoomSupervisor, RoomServer}
  require Logger

  @impl true
  def join("room:" <> room_id, _params, socket) do
    # Get or create room
    {:ok, _pid} = RoomSupervisor.get_or_create_room(room_id)

    # Get current state
    current_state = RoomServer.get_state(room_id)

    # Track connection
    user_id = socket.assigns[:user_id] || "anon-#{:rand.uniform(1000)}"
    RoomServer.add_connection(room_id, self(), user_id)

    # Track presence
    {:ok, _} = RightTaskWeb.Presence.track(socket, user_id, %{
      online_at: inspect(System.system_time(:second))
    })

    socket = socket
      |> assign(:room_id, room_id)
      |> assign(:user_id, user_id)

    Logger.info("✅ Client joined room:#{room_id}")

    # Convert binary state to list for JavaScript client
    state_list = if byte_size(current_state) > 0, do: :binary.bin_to_list(current_state), else: []

    {:ok, %{state: state_list}, socket}
  end

  @impl true
  def handle_in("update", %{"data" => update_data}, socket) do
    room_id = socket.assigns.room_id

    # Convert list of integers to binary (Phoenix JS sends arrays)
    update_binary = :binary.list_to_bin(update_data)

    # Apply to room
    RoomServer.apply_update(room_id, update_binary)

    # Broadcast to others (exclude sender) - send as list for JS clients
    broadcast_from!(socket, "update", %{data: update_data})

    {:noreply, socket}
  end

  @impl true
  def handle_in("awareness", awareness_data, socket) do
    broadcast_from!(socket, "awareness", awareness_data)
    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    if room_id = socket.assigns[:room_id] do
      RoomServer.remove_connection(room_id, self())
    end
    :ok
  end
end
