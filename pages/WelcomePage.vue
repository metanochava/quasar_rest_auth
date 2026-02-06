<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="welcome-card shadow-10">
      <q-card-section class="text-center">
        <q-icon name="rocket_launch" size="80px" color="primary" />

        <div class="text-h4 q-mt-md text-weight-bold">Welcome to MyTech SaaS</div>

        <div class="text-subtitle1 text-grey-7 q-mt-sm">
          Plataforma inteligente para gestão empresarial moderna
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center">
        <q-btn
          color="primary"
          label="Entrar no Sistema"
          icon="login"
          class="q-px-lg"
          @click="$router.push('/login')"
        />

        <q-btn flat color="secondary" label="Criar Conta" class="q-ml-md" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
</script>

<style scoped>
.welcome-card {
  width: 420px;
  max-width: 90%;
  border-radius: 20px;
  padding: 10px;
}
</style>

