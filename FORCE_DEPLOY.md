# FORCE DEPLOY - 16/02/2026 00:13 BRT

Forçando deploy no Vercel para aplicar correções críticas.

## Commits aplicados:
- b8ff493: Remover .eq('ativo', true) de usuarios
- 19a06c3: Corrigir .eq('ativo') para .eq('status', 'ativo') em equipamentos

## Problema:
Deploy não estava propagando as mudanças.

## Status banco:
- 31 equipamentos cadastrados
- Query retornando 0 equipamentos
