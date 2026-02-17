package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/argon2"
)

// Service handles authentication logic
type Service struct {
	db        *sql.DB
	jwtSecret string
}

// NewService creates new auth service
func NewService(db *sql.DB, jwtSecret string) *Service {
	return &Service{db: db, jwtSecret: jwtSecret}
}

// RegisterRequest for user registration
type RegisterRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest for user login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse contains JWT tokens
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// User minimal data
type User struct {
	ID       int64  `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	IsAdmin  bool   `json:"is_admin"`
}

// CustomClaims extends JWT claims with custom fields
type CustomClaims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	IsAdmin bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

// Register creates new user account
func (s *Service) Register(req RegisterRequest) (*User, error) {
	if req.Email == "" || req.Username == "" || req.Password == "" {
		return nil, errors.New("missing required fields")
	}

	hash := hashPassword(req.Password)
	var userID int64

	err := s.db.QueryRow(
		`INSERT INTO users (email, username, password_hash)
		 VALUES ($1, $2, $3) RETURNING id`,
		req.Email, req.Username, hash,
	).Scan(&userID)

	if err != nil {
		if err.Error() == "pq: duplicate key value violates unique constraint" {
			return nil, errors.New("email or username already exists")
		}
		return nil, err
	}

	// Create inventory for user
	_, err = s.db.Exec(
		`INSERT INTO inventories (user_id) VALUES ($1)`,
		userID,
	)
	if err != nil {
		// Rollback user creation
		s.db.Exec(`DELETE FROM users WHERE id = $1`, userID)
		return nil, err
	}

	return &User{ID: userID, Email: req.Email, Username: req.Username, IsAdmin: false}, nil
}

// Login authenticates user and returns JWT
func (s *Service) Login(req LoginRequest) (*AuthResponse, error) {
	var userID int64
	var passwordHash string
	var isAdmin bool

	err := s.db.QueryRow(
		`SELECT id, password_hash, is_admin FROM users WHERE email = $1`,
		req.Email,
	).Scan(&userID, &passwordHash, &isAdmin)

	if err == sql.ErrNoRows {
		return nil, errors.New("invalid email or password")
	}
	if err != nil {
		return nil, err
	}

	if !verifyPassword(req.Password, passwordHash) {
		return nil, errors.New("invalid email or password")
	}

	accessToken, err := s.generateJWT(userID, req.Email, isAdmin, 15*time.Minute)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateJWT(userID, req.Email, isAdmin, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900, // 15 minutes in seconds
	}, nil
}

// RefreshToken validates refresh token and issues new access token
func (s *Service) RefreshToken(refreshToken string) (*AuthResponse, error) {
	claims, err := s.validateJWT(refreshToken)
	if err != nil {
		return nil, err
	}

	accessToken, err := s.generateJWT(claims.UserID, claims.Email, claims.IsAdmin, 15*time.Minute)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		AccessToken: accessToken,
		ExpiresIn:   900,
	}, nil
}

// ValidateToken checks JWT validity and returns claims
func (s *Service) ValidateToken(tokenString string) (*jwt.RegisteredClaims, error) {
	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	return claims, nil
}

// GetUser retrieves user by ID
func (s *Service) GetUser(userID int64) (*User, error) {
	var user User
	err := s.db.QueryRow(
		`SELECT id, email, username, is_admin FROM users WHERE id = $1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Username, &user.IsAdmin)

	if err == sql.ErrNoRows {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Private helpers

func hashPassword(password string) string {
	hash := argon2.IDKey([]byte(password), []byte("salt"), 1, 64*1024, 4, 32)
	return fmt.Sprintf("%x", hash)
}

func verifyPassword(password, hash string) bool {
	testHash := argon2.IDKey([]byte(password), []byte("salt"), 1, 64*1024, 4, 32)
	return fmt.Sprintf("%x", testHash) == hash
}

func (s *Service) generateJWT(userID int64, email string, isAdmin bool, duration time.Duration) (string, error) {
	now := time.Now()
	claims := CustomClaims{
		UserID:  userID,
		Email:   email,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID),
			Issuer:    "rpggame-auth",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(duration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) validateJWT(tokenString string) (*CustomClaims, error) {
	claims := &CustomClaims{}
	_, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}
