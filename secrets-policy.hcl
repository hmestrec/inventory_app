path "secret/*" {
  capabilities = ["read"]
  # Custom control group logic can be added here if supported
  # Example for rate limiting, but this typically requires a plugin or external control.
}

