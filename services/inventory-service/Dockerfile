FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
ENV GOTOOLCHAIN=auto
RUN cd services/inventory-service && go mod download
RUN cd services/inventory-service && CGO_ENABLED=0 GOOS=linux go build -o inventory-service cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/services/inventory-service/inventory-service .
EXPOSE 8003
CMD ["./inventory-service"]
