# Guía de Despliegue en Render (Gratuito)

Esta guía te ayudará a desplegar la aplicación RIFA WEB en Render de forma gratuita.

## Requisitos Previos

- Cuenta de GitHub (crea una en https://github.com/signup)
- Cuenta de Render (crea una en https://render.com)
- El código del proyecto (ya está listo)

## Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `rifa-app`
3. Descripción: "Sistema de Rifa de 1000 Números"
4. Selecciona "Public" (para que Render pueda acceder)
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

## Paso 3: Crear Cuenta en Render

1. Ve a https://render.com
2. Haz clic en "Sign up"
3. Elige "Sign up with GitHub"
4. Autoriza Render para acceder a tus repositorios

## Paso 4: Crear Servicio Web en Render

1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio `rifa-app`
4. Configura:
   - **Name:** rifa-app
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
   - **Plan:** Free

## Paso 5: Crear Base de Datos PostgreSQL

1. En el dashboard de Render, haz clic en "New +"
2. Selecciona "PostgreSQL"
3. Configura:
   - **Name:** rifa-db
   - **Database:** rifa_db
   - **User:** rifa_user
   - **Plan:** Free
4. Copia la **Internal Database URL** (la necesitarás en el paso siguiente)

## Paso 6: Configurar Variables de Entorno

En tu servicio web de Render:

1. Ve a la pestaña "Environment"
2. Agrega estas variables (reemplaza los valores):

```
DATABASE_URL=postgresql://rifa_user:PASSWORD@HOST:5432/rifa_db
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
```

**Nota:** Obtén los valores de Manus de tu panel de administración.

## Paso 7: Desplegar

1. Render detectará cambios automáticamente
2. Ve a la pestaña "Deploys" para ver el progreso
3. Espera a que el despliegue se complete (5-10 minutos)
4. Tu aplicación estará disponible en: `https://rifa-app.onrender.com`

## Paso 8: Ejecutar Migraciones de Base de Datos

Una vez desplegado:

1. Ve a tu servicio web en Render
2. Abre la consola (Shell)
3. Ejecuta:
   ```bash
   pnpm db:push
   ```

## Solución de Problemas

### El despliegue falla
- Verifica que el `DATABASE_URL` es correcto
- Revisa los logs en la pestaña "Logs" de Render

### La base de datos no se conecta
- Asegúrate de que el `DATABASE_URL` está completo
- Verifica que la base de datos está en estado "Available"

### La aplicación muestra errores
- Revisa los logs en Render
- Verifica que todas las variables de entorno están configuradas

## Notas Importantes

- El plan gratuito de Render tiene limitaciones:
  - Se detiene después de 15 minutos de inactividad
  - Máximo 0.5 GB de RAM
  - Máximo 1 GB de almacenamiento en BD
- Para producción, considera un plan pagado
- Las variables de entorno deben ser exactas (sin espacios)

## Soporte

Si tienes problemas:
1. Revisa los logs en Render
2. Verifica que todas las variables de entorno son correctas
3. Contacta a soporte de Render en https://render.com/support
