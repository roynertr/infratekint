# Migración piloto del blog (WordPress → Astro)

**Fecha:** 2026-05-09  
**Fuente de texto:** páginas públicas en `https://infratekint.com/…` (MySQL local no estaba disponible en el momento de la migración).

## Posts añadidos (`src/data/blog/es/`)

| Slug | `pubDate` | `mappingKey` |
| --- | --- | --- |
| `coordinacion-bim-inteligente` | 2021-06-12 | coordinacion-bim-inteligente |
| `sorteos-de-obras-en-rd` | 2020-09-27 | sorteos-de-obras-en-rd |
| `gestion-de-informacion-en-la-construccion-para-que-me-sirve` | 2020-08-11 | gestion-de-informacion-en-la-construccion-para-que-me-sirve |
| `open-bim-y-su-relacion-con-la-norma-iso-19650-2-2` | 2020-06-22 | open-bim-y-su-relacion-con-la-norma-iso-19650-2-2 |
| `open-bim-y-su-relacion-con-la-norma-iso-19650-1-2` | 2020-06-08 | open-bim-y-su-relacion-con-la-norma-iso-19650-1-2 |

## Autor

- **Royner Tineo:** `src/data/authors/royner-tineo/index.mdx`
- Avatar: copia provisional desde `web-reaper/avatar.jpg` hasta tener foto definitiva.

## Imágenes

### Hero (`heroImage`)

Todos los posts piloto usan **el mismo archivo placeholder**: copia de  
`src/data/blog/es/tsconfig-paths-setup/heroImage.jpg` → `heroImage.jpg` en cada carpeta del post.

Cuando existan los featured images originales desde `wp-content/uploads`, sustituir por archivo real y actualizar la ruta relativa en el frontmatter si hace falta.

### Contenido inline

- **Coordinación BIM:** referencia visual “segunda pantalla” descrita en texto; imagen embebida original no migrada aquí.
- **ISO 19650 (2/2):** tabla/imagen comparativa no incluida; se enlaza el PDF en Drive indicado en el artículo original y la navegación interna al post (1/2).

Consultar lista histórica de archivos faltantes en el proyecto WordPress:  
`C:\xampp\htdocs\infratekint\docs\blog-missing-images-report.md`

## Notas

- Categorías están en minúsculas y con guiones (`bim`, `implementacion`, etc.) para alinearlas con el uso existente en el tema.
- El artículo ISO (1/2) conserva un enlace externo histórico a contenido en `rtric.com`; se puede sustituir por rutas internas cuando existan equivalentes en INFRATEK.

## Validación recomendada

1. `npm run dev` → `/es/blog` y cada URL `/es/blog/<slug>/`
2. `npm run build` → revisar salida del proyecto (advertencias previas de compress/plugins si aparecen en tu entorno).
