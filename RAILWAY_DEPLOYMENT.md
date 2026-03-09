# Guía de Despliegue en Railway (Gratuito)

Railway es la mejor opción gratuita para desplegar esta aplicación. Ofrece $5/mes en créditos gratuitos, suficiente para una aplicación pequeña.

## Requisitos Previos

- Cuenta de GitHub (crea una en https://github.com/signup)
- Cuenta de Railway (crea una en https://railway.app)
- El código del proyecto (ya está listo)

## Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `rifa-app`
3. Descripción: "Sistema de Rifa de 1000 Números"
4. Selecciona "Public"
5. Haz clic en "Create repository"

## Paso 2: Subir el Código a GitHub

Ejecuta estos comandos en tu terminal:

```bash
cd /home/ubuntu/rifa-app
git remote add origin https://github.com/TU_USUARIO/rifa-app.git
git branch -M main
git push -u origin main
```

Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.

## Paso 3: Crear Cuenta en Railway

1. Ve a https://railway.app
2. Haz clic en "Start Project"
3. Elige "Deploy from GitHub"
4. Autoriza Railway para acceder a tus repositorios
5. Selecciona el repositorio `rifa-app`

## Paso 4: Railway Detectará Automáticamente

Railway detectará automáticamente que es una aplicación Node.js y:
- Instalará las dependencias (`pnpm install`)
- Compilará el proyecto (`pnpm build`)
- Iniciará la aplicación (`pnpm start`)

## Paso 5: Agregar Base de Datos PostgreSQL

1. En el dashboard de Railway, haz clic en "Add Service"
2. Selecciona "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia la **DATABASE_URL** que aparece en las variables de entorno

## Paso 6: Configurar Variables de Entorno

En Railway, ve a tu proyecto y agrega estas variables en la sección "Variables":

```
DATABASE_URL=postgresql://... (Railway lo genera automáticamente)
JWT_SECRET=tu_jwt_secret_muy_largo_minimo_32_caracteres
VITE_APP_ID=tu_app_id_de_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=tu_owner_id
OWNER_NAME=Tu Nombre
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=tu_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_api_key
NODE_ENV=production
PORT=3000
```

**Nota:** Obtén los valores de Manus de tu panel de administración.

## Paso 7: Desplegar

1. Railway detectará cambios automáticamente en GitHub
2. Ve a la pestaña "Deployments" para ver el progreso
3. Espera a que el despliegue se complete (3-5 minutos)
4. Tu aplicación estará disponible en la URL que Railway genera (ej: `https://rifa-app-production.up.railway.app`)

## Paso 8: Ejecutar Migraciones de Base de Datos

Una vez desplegado:

1. Ve a tu servicio web en Railway
2. Abre la consola (Shell)
3. Ejecuta:
   ```bash
   pnpm db:push
   ```

## Ventajas de Railway

✅ $5/mes de créditos gratuitos (suficiente para esta app)
✅ Soporta Node.js, PostgreSQL, MySQL
✅ Despliegue automático desde GitHub
✅ SSL/HTTPS incluido
✅ Sin restricciones de inactividad
✅ Interfaz muy intuitiva

## Solución de Problemas

### El despliegue falla
- Verifica que el `DATABASE_URL` es correcto
- Revisa los logs en la pestaña "Logs"

### La base de datos no se conecta
- Asegúrate de que PostgreSQL está agregado como servicio
- Verifica que el `DATABASE_URL` está en las variables de entorno

### La aplicación muestra errores
- Revisa los logs en Railway
- Verifica que todas las variables de entorno están configuradas
- Asegúrate de que ejecutaste `pnpm db:push`

## Monitoreo de Créditos

Railway te da $5/mes gratuitos. Puedes:
- Ver el uso en el dashboard
- Configurar alertas de gasto
- Escalar a plan pagado si es necesario

## Soporte

Si tienes problemas:
1. Revisa los logs en Railway
2. Verifica que todas las variables de entorno son correctas
3. Contacta a soporte de Railway en https://railway.app/support
