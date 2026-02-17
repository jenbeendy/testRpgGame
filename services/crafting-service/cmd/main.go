package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
	"github.com/rpgGame/crafting-service/internal/crafting"
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

	// Configure connection pool for PostgreSQL - optimized for 100-500 concurrent users
	db.SetMaxOpenConns(25)         // Max concurrent connections
	db.SetMaxIdleConns(5)          // Keep 5 idle connections ready
	db.SetConnMaxLifetime(0)       // No limit on connection lifetime

	if err := db.Ping(); err != nil {
		log.Fatal("cannot connect to database:", err)
	}

	craftService := crafting.NewService(db)
	craftHandler := crafting.NewHandler(craftService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Get("/recipes", craftHandler.GetRecipesHandler)
	r.Get("/recipes/{id}", craftHandler.GetRecipeHandler)
	r.Get("/recipes/{id}/hint", craftHandler.GetRecipeHintHandler)
	r.Post("/craft", craftHandler.CraftHandler)
	r.Get("/player-recipes/{userId}", craftHandler.GetPlayerRecipesHandler)
	r.Post("/discover-recipe", craftHandler.DiscoverRecipeHandler)
	r.Get("/skills/{userId}", craftHandler.GetSkillsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8002"
	}

	log.Printf("Crafting service listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
