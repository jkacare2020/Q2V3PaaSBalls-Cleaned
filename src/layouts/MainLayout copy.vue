<template>
  <q-layout view="hHh lpR lFf">
    <q-header :elevated="useLightOrDark(true, false)">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <div class="absolute-center">
            <div class="toolbar-title-text">
              <q-icon name="savings" />
              PaaS-Balls
            </div>
          </div>
        </q-toolbar-title>

        <q-btn
          v-if="$route.fullPath === '/'"
          @click="storeEntries.options.sort = !storeEntries.options.sort"
          :label="!storeEntries.options.sort ? 'Sort' : 'Done'"
          flat
          no-caps
          dense
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      class="bg-primary"
      :width="250"
      :breakpoint="767"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label class="text-white" header> Navigation </q-item-label>

        <NavLink v-for="link in navLinks" :key="link.title" v-bind="link" />

        <q-item
          v-if="$q.platform.is.electron"
          @click="quitApp"
          clickable
          class="text-white absolute-bottom"
          tag="a"
        >
          <q-item-section avatar>
            <q-icon name="power_settings_new" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Quit</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-drawer
      v-model="leftDrawerOpen"
      class="bg-primary"
      :width="250"
      :breakpoint="767"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label class="text-white" header>Navigation</q-item-label>

        <NavLink
          v-for="link in navLinks"
          :key="link.title"
          :title="link.title"
          :icon="link.icon"
          :link="link.link"
          @closeDrawer="leftDrawerOpen = false"
        />

        <q-item
          v-if="$q.platform.is.electron"
          @click="quitApp"
          clickable
          class="text-white absolute-bottom"
          tag="a"
        >
          <q-item-section avatar>
            <q-icon name="power_settings_new" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Quit</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { useStoreEntries } from "src/stores/storeEntries";
import { useLightOrDark } from "src/use/useLightOrDark";
import NavLink from "components/Nav/NavLink.vue";

defineOptions({
  name: "MainLayout",
});

const $q = useQuasar(),
  storeEntries = useStoreEntries();

const navLinks = [
  {
    title: "Entries",
    icon: "savings",
    link: "/",
  },
  {
    title: "Settings",
    icon: "settings",
    link: "/settings",
  },

  {
    title: "Login",
    icon: "login",
    link: "/login", // Adjust as per your route setup
  },
  {
    title: "Signup",
    icon: "person_add",
    link: "/signup", // Adjust as per your route setup
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const quitApp = () => {
  $q.dialog({
    title: "Confirm",
    message: "Really quit PaaS-Balls?",
    cancel: true,
    persistent: true,
    html: true,
    ok: {
      label: "Quit",
      color: "negative",
      noCaps: true,
    },
    cancel: {
      color: "primary",
      noCaps: true,
    },
  }).onOk(() => {
    if ($q.platform.is.electron) ipcRenderer.send("quit-app");
  });
};
</script>
