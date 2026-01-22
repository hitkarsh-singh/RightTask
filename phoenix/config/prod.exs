import Config

# Production endpoint configuration
config :right_task, RightTaskWeb.Endpoint,
  url: [host: System.get_env("PHX_HOST") || "righttask-phoenix.fly.dev", port: 443, scheme: "https"],
  http: [port: String.to_integer(System.get_env("PORT") || "8080")],
  check_origin: ["https://righttask.netlify.app", "http://localhost:5173"],
  force_ssl: [rewrite_on: [:x_forwarded_proto]],
  exclude: [
    # paths: ["/health"],
    hosts: ["localhost", "127.0.0.1"]
  ]

# Do not print debug messages in production
config :logger, level: :info

# Runtime production configuration, including reading
# of environment variables, is done on config/runtime.exs.
