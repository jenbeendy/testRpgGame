FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
ENV GOTOOLCHAIN=auto
RUN cd services/crafting-service && go mod download
RUN cd services/crafting-service && CGO_ENABLED=0 GOOS=linux go build -o crafting-service cmd/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/services/crafting-service/crafting-service .
EXPOSE 8002
CMD ["./crafting-service"]
