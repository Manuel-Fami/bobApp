# Partie Explicative du Projet

## Liens du projets

SonarCloud : https://sonarcloud.io/organizations/manuel-fami/projects
Dockerhub : https://hub.docker.com/repositories/manuel1414

## Les étapes de GitHub Actions

### Backend CI/CD

Les fichiers CI CD sont configurer pour exécuter des pipelines automatisés lorsque certains évenements spécifiquent se produisent dans un dépôt git.

#### Fichier: `.github/workflows/backend_cicd.yml`

Le champ on définit les événements qui déclencheront l'exécution de ce workflow. Deux types d'événements sont spécifiés : push et pull_request.

- **Push**:
  push:
  paths: (Restreint l'exécution uniquement si les fichiers modifiés se trouvent dans les chemins spécifiés.)

  - "back/\*\*"
  - ".github/workflows/\*\*"
    branches: - main

- **Pull Request**:

  pull_request:
  paths: - "back/**" - ".github/workflows/**"
  branches: - main
  types: - opened - synchronize - reopened

Le workflow est exécuté lorsque une pull request est ouverte, synchronisée (mise à jour avec de nouveaux commits), ou rouverte, si les changements affectent les chemins spécifiés.

Les actions suivantes configure un job GitHub Actions qui éxecute des étapes pour tester et analyser le code du back-end.

**Backend**

jobs:
backend_test:
runs-on: ubuntu-latest

- **jobs** : Déclare les tâches à exécuter dans ce workflow.
- **runs-on: ubuntu-latest** : Spécifie que le job s'exécutera sur un runner GitHub utilisant la dernière version d'Ubuntu.

**Tests**
Cette section configure un job GitHub Actions nommé backend_test qui exécute des étapes pour tester et analyser le code du back-end. Voici une explication détaillée des parties de ce job :

- Vérifie le code du back-end après l’avoir cloné.

```yaml
- name: Checkout
  uses: actions/checkout@v4
```

- Configure un environnement Java 17 pour le projet.

```yaml
- name: Set Up JDK 17
  uses: actions/setup-java@v4
  with:
    java-version: "17"
    distribution: "adopt"
```

- Met en cache les dépendances Maven et les artefacts de build pour accélérer les exécutions.

```yaml
- name: Cache Maven Packages
  uses: actions/cache@v4
  with:
    path: ~/.m2
    key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
    restore-keys: |
      ${{ runner.os }}-m2
```

```yaml
- name: Cache Build Output
  uses: actions/cache@v4
  with:
    path: target
    key: ${{ runner.os }}-build-${{ hashFiles('**/pom.xml') }}
    restore-keys: |
      ${{ runner.os }}-build-
```

- Compile, teste et analyse le code avec Maven.

```yaml
- name: Build and Test with Maven
  run: mvn -B clean verify
```

- Sauvegarde les rapports de couverture de code (JaCoCo).

```yaml
- name: Upload Jacoco Report
  uses: actions/upload-artifact@v4
  with:
    name: jacoco-report
    path: back/target/site/jacoco/
    overwrite: true
    if-no-files-found: error
```

- Analyse la qualité du code et les vulnérabilités avec SonarQube.

```yaml
- name: Check sonar-project.properties
  run: cat sonar-project.properties
```

```yaml
- name: SonarCloud Scan
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  run: mvn -B verify org.sonarsource.scanner.maven:sonar-maven-plugin:4.0.0.4121:sonar
```

Ce workflow assure une intégration continue de haute qualité pour le back-end du projet, en combinant tests unitaires, rapports de couverture, et analyses de code.

### Docker

Ce segment du fichier GitHub Actions configure un deuxième job nommé docker, qui intervient après l'exécution du job backend_test. Son rôle est de créer et publier une image Docker pour le back-end sur Docker Hub.

- **Objectif**: Déployer l'image Docker du backend sur Docker Hub.

- **Étapes**:
- **Checkout**: Clone le dépôt GitHub pour avoir accès au code source nécessaire pour construire l'image Docker.

```yaml
    - name: Checkout
        uses: actions/checkout@v4
```

- **Set Up Docker Buildx**: Configure Docker Buildx, un outil permettant de construire des images Docker multiplateformes.

```yaml
    - name: Set Up Docker Buildx
        uses: docker/setup-buildx-action@v3.3.0
```

- **Login to Docker Hub**: Se connecte à Docker Hub en utilisant les informations d'identification stockées en tant que secrets GitHub.

```yaml
    - name: Login to Docker Hub
        uses: docker/login-action@v3.2.0
        with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
```

- **Build and Push Backend Docker Image**: Compile et déploie l'image du projet sur Docker Hub.

```yaml
    - name: Build and Push Backend Docker Image
        uses: docker/build-push-action@v6.2.0
        with:
        context: ./back
        file: ./back/Dockerfile
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/bobapp-back:latest
```

### Frontend CI/CD

#### Fichier: `.github/workflows/frontend_cicd.yml`

Ce workflow est déclenché par les événements suivants :

- **Push**:
  push:
  paths: (Restreint l'exécution uniquement si les fichiers modifiés se trouvent dans les chemins spécifiés.)

        - "front/\*\*"
        - ".github/workflows/\*\*"

  branches: - main

- **Pull Request**:

  pull_request:
  paths:

        - "front/\*\*"
        - ".github/workflows/\*\*"

  types: - opened - synchronize - reopened

**Tests**

- **Objectif**: Tester le frontend, vérifier la couverture de code et analyser la qualité du code avec SonarCloud.
- **Étapes**:
- **Checkout**: Récupère le code source.

```yaml
    - name: Checkout
        uses: actions/checkout@v4
```

- **Use Node.js**: Configure la version de Node.js nécessaire pour le projet.

```yaml
    - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
        node-version: ${{ matrix.node-version }}
```

- **Cache Node Modules**: Cache les modules Node.js pour accélérer les builds futurs.

```yaml
    - name: Cache Node Modules
        uses: actions/cache@v4
        with:
        path: ~/.npm
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
        restore-keys: |
            ${{ runner.os }}-node-
```

- **Install Dependencies**: Installe les dépendances du projet.

```yaml
    - name: Install Dependencies
        run: npm ci
```

- **Build Angular Project**: Compile le projet Angular.

```yaml
    - name: Build Angular Project
        run: npm run build
```

- **Run Tests and Generate Code Coverage Report**: Exécute les tests et génére un rapport de couverture de code.

```yaml
    - name: Run Tests and Generate Code Coverage Report
        run: npm run test -- --no-watch --no-progress --browsers=ChromeHeadless --code-coverage
```

- **Upload Code Coverage Report**: Télécharge le rapport de couverture de code.

```yaml
    - name: Upload Code Coverage Report
        uses: actions/upload-artifact@v4
        with:
        name: front-coverage-report
        path: front/coverage/
        overwrite: true
        if-no-files-found: error
```

- **SonarCloud Scan**: Exécute l'analyse SonarCloud pour évaluer la qualité du code frontend.

```yaml
    - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        with:
        projectBaseDir: front
        env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Docker

- **Checkout**: Clone le dépôt GitHub pour accéder au code source nécessaire pour construire l'image Docker.

```yaml
    - name: Checkout
        uses: actions/checkout@v4
```

- **Set Up Docker Buildx**: Configure Docker Buildx pour permettre la construction d'images Docker multiplateformes.

```yaml
    - name: Set Up Docker Buildx
        uses: docker/setup-buildx-action@v3.3.0
```

- **Login to Docker Hub**: Se connecte à Docker Hub en utilisant les informations d'identification stockées en tant que secrets GitHub.

```yaml
    - name: Login to Docker Hub
        uses: docker/login-action@v3.2.0
        with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
```

- **Build and Push Frontend Docker Image**: Compile et déploie l'image du projet sur Docker Hub.

```yaml
    - name: Build and Push Frontend Docker Image
        uses: docker/build-push-action@v6.2.0
        with:
        context: ./front
        file: ./front/Dockerfile
        push: true
        tags: ${{ secrets.DOCKER_USERNAME }}/bobapp-front:latest
```

## Key Performance Indicators (KPIs)

Dans SonarCloud, l'analyse du projet repose sur les indicateurs du quality gate "Sonar Way". Un autre quality gate nommé "bobapp-qualitygate" a également été configuré à titre expérimental.

Sécurité

Analyse les vulnérabilités susceptibles de compromettre l'application, telles que les failles potentielles liées aux injections SQL ou à une gestion insuffisante des mécanismes d'authentification. L'objectif est d'identifier et de prévenir les risques exploitables par des attaquants. Une notation de A à E est utilisée, où A représente le meilleur score. Le niveau minimal attendu est A.

Fiabilité

Repère les défauts susceptibles de provoquer des erreurs, tels que des conditions logiques défaillantes, une mauvaise gestion des exceptions, ou des références nulles. Cette métrique vise à assurer la robustesse du code. La notation suit une échelle de A à E, avec un seuil minimal fixé à A.

Maintenabilité

Évalue la capacité du code à être modifié ou amélioré facilement. Ce critère s'appuie sur des aspects tels que la lisibilité, la réduction des redondances, la gestion de la complexité, et la qualité de l'architecture. Un code bien conçu simplifie les évolutions et corrections futures. La notation, de A à E, impose un minimum de A.

Hotspots Reviewed

Vérifie que tous les points sensibles liés à la sécurité (Security Hotspots) identifiés dans le code récent ont été soigneusement examinés. Pour respecter les exigences, 100 % des hotspots doivent être validés.

Couverture de code

Mesure le pourcentage de code couvert par des tests automatisés, comme les tests unitaires. Une couverture élevée reflète une bonne préparation aux évolutions et une moindre probabilité d'introduire des erreurs. Le seuil attendu est de 80 % au minimum.

Duplications

Quantifie le pourcentage de code dupliqué dans le projet. La duplication complique la maintenance et risque d'introduire des incohérences si des modifications ne sont pas appliquées de manière uniforme. SonarCloud identifie ces segments pour encourager la réutilisation et optimiser la structure du code. La limite maximale tolérée est de 3 %.

## L'analyse des métrics

Backend : Rapport de couverture JaCoCo

- Couverture des instructions : 32 %
- Couverture des branches : 50 %
- Complexité cyclomatique : 15
- Lignes manquantes : 45
- Méthodes manquantes : 18
- Classes manquantes : 6

Le seuil recommandé pour une bonne couverture de code est de 80 %. Les résultats actuels montrent un niveau de couverture bien en dessous de cette valeur, indiquant que les tests unitaires et d'intégration ne couvrent pas suffisamment le code existant.

Frontend : Rapport de couverture Karma-Coverage (Istanbul)

- Couverture des déclarations : 73,33 %
- Couverture des branches : 100 %
- Couverture des fonctions : 57,14 %
- Couverture des lignes : 78,57 %

La couverture des branches atteint un excellent niveau, ce qui est un point très positif. Cependant, la couverture des fonctions est particulièrement faible, révélant qu’environ la moitié des méthodes n’ont pas été testées. La couverture des déclarations reste moyenne et pourrait être améliorée pour garantir une meilleure fiabilité du code.

## Commentaires utilisateurs

- Un utilisateur signale un bug avec un bouton de suggestion de blague, bien que cette fonctionnalité n'existe pas actuellement dans l'application. Cela pourrait être une opportunité intéressante à envisager pour une future implémentation.
- Un utilisateur évoque un bug récurrent lié à la publication de vidéos, alors que cette fonctionnalité n'est pas encore disponible. Cela pourrait être une piste à explorer pour enrichir l'application.
- Un utilisateur indique ne plus recevoir de réponses à ses e-mails, ce qui semble être un problème à investiguer.
- Un utilisateur, déçu par l'application, a décidé de la retirer de ses favoris.

La priorité doit être donnée à la résolution des bugs actuels. Un dysfonctionnement dans le frontend de l'application a été signalé, empêchant l'affichage correct des blagues. Il est également crucial de veiller à ce que le frontend soit pleinement compatible avec tous les navigateurs.
En parallèle, une révision de la couverture des tests s’impose pour renforcer la qualité et la sécurité du code existant.
