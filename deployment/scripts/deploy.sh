#!/bin/bash
# ===========================================
# Script de déploiement Valthera Adventures
# Pour VPS Ubuntu avec Nginx existant
# ===========================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="valthera-adventures.sourcekod.fr"
APP_DIR="/opt/valthera-adventures"
DEPLOY_DIR="$APP_DIR/deployment"

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
    
    if ! docker compose version &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    if ! command -v nginx &> /dev/null; then
        error "Nginx n'est pas installé"
    fi
    
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        error "Fichier .env manquant dans $DEPLOY_DIR"
    fi
    
    success "Prérequis vérifiés"
}

# Configuration Nginx
setup_nginx() {
    log "Configuration de Nginx..."
    
    # Copier la configuration
    sudo cp "$DEPLOY_DIR/nginx/valthera-adventures.conf" /etc/nginx/sites-available/
    
    # Créer le lien symbolique si nécessaire
    if [ ! -L /etc/nginx/sites-enabled/valthera-adventures.conf ]; then
        sudo ln -s /etc/nginx/sites-available/valthera-adventures.conf /etc/nginx/sites-enabled/
    fi
    
    # Créer le dossier pour certbot
    sudo mkdir -p /var/www/certbot
    
    # Tester la configuration
    sudo nginx -t
    
    # Recharger Nginx
    sudo systemctl reload nginx
    
    success "Nginx configuré"
}

# Obtenir certificat SSL
get_ssl() {
    log "Obtention du certificat SSL Let's Encrypt..."
    
    # Vérifier si certbot est installé
    if ! command -v certbot &> /dev/null; then
        log "Installation de Certbot..."
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Obtenir le certificat
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@sourcekod.fr
    
    success "Certificat SSL obtenu"
}

# Construire et démarrer les conteneurs
deploy() {
    log "Construction et démarrage des conteneurs..."
    
    cd "$DEPLOY_DIR"
    
    # Pull de l'image MongoDB
    docker compose pull mongo
    
    # Build des images personnalisées
    docker compose build --no-cache
    
    # Démarrer les services
    docker compose up -d
    
    # Attendre que les services soient prêts
    log "Attente du démarrage des services..."
    sleep 15
    
    # Vérifier le statut
    docker compose ps
    
    success "Déploiement terminé"
}

# Déployer les commandes Discord
deploy_commands() {
    log "Déploiement des commandes Discord..."
    cd "$DEPLOY_DIR"
    docker compose exec bot node src/scripts/deploy-commands.js
    success "Commandes Discord déployées"
}

# Mise à jour
update() {
    log "Mise à jour de l'application..."
    
    cd "$APP_DIR"
    git pull origin main
    
    cd "$DEPLOY_DIR"
    docker compose build --no-cache
    docker compose up -d
    
    success "Application mise à jour"
}

# Afficher les logs
show_logs() {
    cd "$DEPLOY_DIR"
    docker compose logs -f "$@"
}

# Menu principal
case "$1" in
    check)
        check_prerequisites
        ;;
    nginx)
        setup_nginx
        ;;
    ssl)
        get_ssl
        ;;
    deploy)
        check_prerequisites
        deploy
        ;;
    commands)
        deploy_commands
        ;;
    update)
        update
        ;;
    logs)
        shift
        show_logs "$@"
        ;;
    restart)
        cd "$DEPLOY_DIR"
        docker compose restart
        ;;
    stop)
        cd "$DEPLOY_DIR"
        docker compose down
        ;;
    status)
        cd "$DEPLOY_DIR"
        docker compose ps
        ;;
    *)
        echo "Usage: $0 {check|nginx|ssl|deploy|commands|update|logs|restart|stop|status}"
        echo ""
        echo "Commandes disponibles:"
        echo "  check    - Vérifier les prérequis"
        echo "  nginx    - Configurer Nginx"
        echo "  ssl      - Obtenir certificat Let's Encrypt"
        echo "  deploy   - Construire et démarrer les conteneurs"
        echo "  commands - Déployer les commandes Discord"
        echo "  update   - Mettre à jour depuis Git"
        echo "  logs     - Afficher les logs (ex: logs bot, logs web)"
        echo "  restart  - Redémarrer tous les services"
        echo "  stop     - Arrêter tous les services"
        echo "  status   - Afficher le statut des services"
        exit 1
        ;;
esac
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
