FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN cd services/admin-service && go mod download
RUN cd services/admin-service && CGO_ENABLED=0 GOOS=linux go build -o admin-service cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/services/admin-service/admin-service .
EXPOSE 8004
CMD ["./admin-service"]
