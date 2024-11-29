<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Users List</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          class="q-mt-md"
          flat
          bordered
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                dense
                flat
                icon="edit"
                color="primary"
                @click="openUserProfile(props.row.id)"
                aria-label="Edit Profile"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed } from "vue";
import { useStoreUsers } from "src/stores/storeUsers";
import { useRouter } from "vue-router";

const storeUsers = useStoreUsers();
const router = useRouter();

const users = computed(() => {
  if (storeUsers.user) {
    return [
      {
        id: storeUsers.user.id,
        registrationDate: storeUsers.user.registrationDate,
        trialEndDate: storeUsers.user.trialEndDate,
        email: storeUsers.user.email,
        role: storeUsers.user.role,
        firstName: storeUsers.user.firstName,
        lastName: storeUsers.user.lastName,
        phoneNo: storeUsers.user.phoneNo,
        companyName: storeUsers.user.companyName,
      },
    ];
  }
  return [];
});

const columns = [
  { name: "firstName", label: "First Name", field: "firstName" },
  { name: "lastName", label: "Last Name", field: "lastName" },
  { name: "email", label: "Email", field: "email" },
  { name: "phoneNo", label: "Phone Number", field: "phoneNo" },
  { name: "companyName", label: "Company Name", field: "companyName" },
  { name: "actions", label: "Actions", field: "actions", align: "center" },
];

function openUserProfile(userId) {
  router.push(`/profile/${userId}`); // Navigate to UserProfile page with the user's ID
}
</script>
