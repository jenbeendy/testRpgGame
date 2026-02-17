package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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

	// Configure connection pool for PostgreSQL - optimized for 100-500 concurrent users
	db.SetMaxOpenConns(25)         // Max concurrent connections
	db.SetMaxIdleConns(5)          // Keep 5 idle connections ready
	db.SetConnMaxLifetime(0)       // No limit on connection lifetime

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
	r.Post("/internal/decay", invHandler.ManualDecayHandler)
	r.Post("/gather/{userId}", invHandler.GatherHandler)
	r.Get("/gold/{userId}", invHandler.GetGoldHandler)
	r.Get("/shop/catalog", invHandler.GetShopCatalogHandler)
	r.Post("/shop/{userId}/buy", invHandler.BuyItemHandler)
	r.Post("/internal/consume/{userId}", invHandler.ConsumeItemsHandler)
	r.Post("/internal/add-item/{userId}", invHandler.AddItemInternalHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8003"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Graceful shutdown context
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Background durability decay goroutine
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				rowsAffected, err := invService.DecayAllDurability()
				if err != nil {
					log.Printf("durability decay error: %v\n", err)
				} else {
					log.Printf("durability decay: %d items affected\n", rowsAffected)
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	log.Printf("Inventory service listening on :%s\n", port)

	// Start server in a goroutine to allow shutdown handling
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-ctx.Done()
	log.Println("shutdown signal received, graceful shutdown...")

	// Graceful shutdown with 5s timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("shutdown error: %v", err)
	}
	log.Println("server stopped")
}
