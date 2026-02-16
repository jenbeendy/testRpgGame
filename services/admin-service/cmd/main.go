package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
	"github.com/rpgGame/admin-service/internal/admin"
)

func main() {
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

	adminService := admin.NewService(db)
	adminHandler := admin.NewHandler(adminService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Admin-only routes
	r.Route("/admin", func(r chi.Router) {
		r.Use(adminHandler.AdminOnly)
		r.Post("/recipes", adminHandler.CreateRecipeHandler)
		r.Post("/items", adminHandler.CreateItemHandler)
		r.Delete("/recipes/{id}", adminHandler.DeleteRecipeHandler)
		r.Delete("/items/{id}", adminHandler.DeleteItemHandler)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8004"
	}

	log.Printf("Admin service listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
