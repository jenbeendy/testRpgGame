package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
	"github.com/rpgGame/auth-service/internal/auth"
)

func main() {
	// DB connection
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:password@localhost:5432/rpggame?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("cannot connect to database:", err)
	}

	// Setup auth service
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-key-change-in-production"
	}

	authService := auth.NewService(db, jwtSecret)
	authHandler := auth.NewHandler(authService)

	// Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// Auth routes
	r.Post("/auth/register", authHandler.RegisterHandler)
	r.Post("/auth/login", authHandler.LoginHandler)
	r.Post("/auth/refresh", authHandler.RefreshHandler)

	// Protected routes
	r.Route("/auth", func(r chi.Router) {
		r.Use(authHandler.AuthMiddleware)
		r.Get("/me", authHandler.MeHandler)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("Auth service listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
