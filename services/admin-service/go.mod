module github.com/rpgGame/admin-service

go 1.22

require (
	github.com/go-chi/chi/v5 v5.0.12
	github.com/lib/pq v1.10.9
	github.com/rpgGame/pkg/models v0.0.0
)

replace github.com/rpgGame/pkg/models => ../../pkg/models
