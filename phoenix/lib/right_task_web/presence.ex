defmodule RightTaskWeb.Presence do
  use Phoenix.Presence,
    otp_app: :right_task,
    pubsub_server: RightTask.PubSub
end
