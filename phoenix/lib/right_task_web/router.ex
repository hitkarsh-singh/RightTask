defmodule RightTaskWeb.Router do
  use RightTaskWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", RightTaskWeb do
    pipe_through :api
  end
end
