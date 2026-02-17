FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN cd services/auth-service && go mod download
RUN cd services/auth-service && CGO_ENABLED=0 GOOS=linux go build -o auth-service cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/services/auth-service/auth-service .
EXPOSE 8001
CMD ["./auth-service"]
