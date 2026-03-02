import js from "@eslint/js";
import vue from "eslint-plugin-vue";

export default [
  // Ignorar coisas que não vale a pena lintar agora
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "supabase/functions/**", // Edge Functions (Deno/TS) -> tratamos depois
      "**/*.d.ts", // está dando "Unexpected token module"
      "src/types/supabase.ts", // types gerados do Supabase -> tratamos depois
      "test-*.js",
      "*.backup",
    ],
  },

  js.configs.recommended,
  ...vue.configs["flat/recommended"],

  // ✅ APP (Browser) - Vue
  {
    files: ["src/**/*.{js,vue}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // browser + web APIs
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        confirm: "readonly",
        alert: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",

        // Web platform
        URL: "readonly",
        URLSearchParams: "readonly",
        Headers: "readonly",
        XMLHttpRequest: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        Image: "readonly",
        performance: "readonly",
        btoa: "readonly",
        crypto: "readonly",
        fetch: "readonly",

        console: "readonly",
      },
    },

    rules: {
      // não queremos briga com nomes single-word
      "vue/multi-word-component-names": "off",

      // Vue “menos chato”
      "vue/v-slot-style": "off",
      "vue/html-self-closing": "off",
      "vue/v-on-event-hyphenation": "off",
      "vue/valid-v-slot": "off",

      // console ok no app
      "no-console": "off",

      // variáveis não usadas como warning
      "no-unused-vars": "warn",

      // switch-case com const/let: vira warning (vamos corrigir pontualmente depois)
      "no-case-declarations": "warn",
    },
  },

  // ✅ SCRIPTS (Node) - scripts/*.mjs|.js e raiz *.js utilitários
  {
    files: ["scripts/**/*.{js,mjs}", "*.js", "*.mjs"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly", // Node 18+ tem fetch
      },
    },

    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
    },
  },
];
