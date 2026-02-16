package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	_ "github.com/lib/pq"
	"github.com/rpgGame/inventory-service/internal/inventory"
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

	invService := inventory.NewService(db)
	invHandler := inventory.NewHandler(invService)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Get("/inventory/{userId}", invHandler.GetInventoryHandler)
	r.Post("/inventory/{userId}/items", invHandler.AddItemHandler)
	r.Delete("/inventory/{userId}/items/{itemId}", invHandler.RemoveItemHandler)
	r.Patch("/inventory/{userId}/items/{itemId}", invHandler.MoveItemHandler)
	r.Post("/inventory/{userId}/items/{itemId}/repair", invHandler.RepairItemHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	log.Printf("Inventory service listening on :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
