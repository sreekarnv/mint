discovery.docker "containers" {
  host = "unix:///var/run/docker.sock"
}

loki.source.docker "logs" {
  host       = "unix:///var/run/docker.sock"
  targets    = discovery.docker.containers.targets
  forward_to = [loki.process.ensure_labels.receiver]
}

loki.process "ensure_labels" {
  stage.static_labels {
    values = {
      env = "dev",
    }
  }

  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://loki:3100/loki/api/v1/push"
  }
}
