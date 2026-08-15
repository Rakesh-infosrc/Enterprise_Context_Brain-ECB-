.PHONY: help up down seed test clean

help:
	@echo "Enterprise Context Brain POC Shortcuts"
	@echo "  make up       - Start all services using docker-compose"
	@echo "  make down     - Stop all services"
	@echo "  make seed     - Populate database with synthetic demo data"
	@echo "  make logs     - View backend container logs"

up:
	docker-compose up -d --build

down:
	docker-compose down

seed:
	docker-compose exec backend python scripts/seed_synthetic_data.py

logs:
	docker-compose logs -f backend
