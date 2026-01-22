defmodule RightTask.Yjs.RoomSupervisor do
  use DynamicSupervisor

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  def get_or_create_room(room_id) do
    case Registry.lookup(RightTask.Yjs.RoomRegistry, room_id) do
      [{pid, _}] -> {:ok, pid}
      [] ->
        spec = {RightTask.Yjs.RoomServer, room_id}
        DynamicSupervisor.start_child(__MODULE__, spec)
    end
  end

  @impl true
  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end
end
