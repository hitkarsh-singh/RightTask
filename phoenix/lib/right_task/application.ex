defmodule RightTask.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      RightTaskWeb.Telemetry,
      {DNSCluster, query: Application.get_env(:right_task, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: RightTask.PubSub},
      {Registry, keys: :unique, name: RightTask.Yjs.RoomRegistry},
      RightTask.Yjs.RoomSupervisor,
      RightTaskWeb.Presence,
      # Start to serve requests, typically the last entry
      RightTaskWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: RightTask.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    RightTaskWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
