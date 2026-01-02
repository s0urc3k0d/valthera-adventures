#!/bin/bash
# ===========================================
# Script de déploiement Valthera Adventures
# ===========================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    if [ ! -f ".env" ]; then
        error "Fichier .env manquant. Copiez .env.example vers .env et configurez-le"
    fi
    
    success "Prérequis vérifiés"
}

# Configuration initiale SSL
init_ssl() {
    log "Initialisation des certificats SSL..."
    
    DOMAIN="valthera-adventures.sourcekod.fr"
    EMAIL="admin@sourcekod.fr"  # Modifiez avec votre email
    
    # Créer les dossiers nécessaires
    mkdir -p certbot/conf certbot/www
    
    # Télécharger les options SSL recommandées
    if [ ! -f "certbot/conf/options-ssl-nginx.conf" ]; then
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
    fi
    
    if [ ! -f "certbot/conf/ssl-dhparams.pem" ]; then
        curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
    fi
    
    # Créer un certificat temporaire si nécessaire
    if [ ! -d "certbot/conf/live/$DOMAIN" ]; then
        log "Création d'un certificat temporaire..."
        mkdir -p certbot/conf/live/$DOMAIN
        openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
            -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
            -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
            -subj "/CN=localhost" 2>/dev/null
    fi
    
    success "SSL initialisé"
}

# Obtenir un vrai certificat Let's Encrypt
get_ssl_certificate() {
    log "Obtention du certificat Let's Encrypt..."
    
    DOMAIN="valthera-adventures.sourcekod.fr"
    EMAIL="admin@sourcekod.fr"  # Modifiez avec votre email
    
    # Démarrer nginx temporairement
    docker compose -f docker-compose.prod.yml up -d nginx
    
    # Supprimer le certificat temporaire
    rm -rf certbot/conf/live/$DOMAIN
    
    # Obtenir le vrai certificat
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Redémarrer nginx
    docker compose -f docker-compose.prod.yml restart nginx
    
    success "Certificat SSL obtenu"
}

# Construire et démarrer les conteneurs
deploy() {
    log "Construction et démarrage des conteneurs..."
    
    # Pull des dernières images de base
    docker compose -f docker-compose.prod.yml pull mongo nginx certbot
    
    # Build des images personnalisées
    docker compose -f docker-compose.prod.yml build --no-cache
    
    # Démarrer les services
    docker compose -f docker-compose.prod.yml up -d
    
    # Attendre que les services soient prêts
    log "Attente du démarrage des services..."
    sleep 10
    
    # Vérifier le statut
    docker compose -f docker-compose.prod.yml ps
    
    success "Déploiement terminé"
}

# Déployer les commandes Discord
deploy_commands() {
    log "Déploiement des commandes Discord..."
    docker compose -f docker-compose.prod.yml exec bot node src/scripts/deploy-commands.js
    success "Commandes Discord déployées"
}

# Afficher les logs
show_logs() {
    docker compose -f docker-compose.prod.yml logs -f
}

# Menu principal
case "$1" in
    init)
        check_prerequisites
        init_ssl
        ;;
    ssl)
        get_ssl_certificate
        ;;
    deploy)
        check_prerequisites
        deploy
        ;;
    commands)
        deploy_commands
        ;;
    logs)
        show_logs
        ;;
    restart)
        docker compose -f docker-compose.prod.yml restart
        ;;
    stop)
        docker compose -f docker-compose.prod.yml down
        ;;
    status)
        docker compose -f docker-compose.prod.yml ps
        ;;
    *)
        echo "Usage: $0 {init|ssl|deploy|commands|logs|restart|stop|status}"
        echo ""
        echo "Commandes disponibles:"
        echo "  init     - Initialiser SSL avec certificat temporaire"
        echo "  ssl      - Obtenir un certificat Let's Encrypt"
        echo "  deploy   - Construire et démarrer les conteneurs"
        echo "  commands - Déployer les commandes Discord"
        echo "  logs     - Afficher les logs en temps réel"
        echo "  restart  - Redémarrer tous les services"
        echo "  stop     - Arrêter tous les services"
        echo "  status   - Afficher le statut des services"
        exit 1
        ;;
esac
