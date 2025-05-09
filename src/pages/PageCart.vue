<template>
  <q-page class="q-pa-md">
    <q-table :rows="cartItems" :columns="columns" row-key="_id">
      <template v-slot:body-cell-quantity="props">
        <div class="row justify-center">
          <q-input
            type="number"
            v-model.number="props.row.quantity"
            min="0"
            dense
            borderless
            style="width: 50px"
            class="q-pa-none q-ml-lg"
            @change="onQtyChange(props.row)"
          />
        </div>
      </template>
    </q-table>

    <div class="q-mt-md text-right">
      <div><strong>Total:</strong> {{ formatCurrency(totalAmount) }}</div>
      <q-btn
        label="Proceed to Checkout"
        color="primary"
        @click="proceedToCheckout"
        class="q-mt-sm"
      />
      <q-btn
        flat
        color="primary"
        label="Invoice"
        @click="downloadInvoice(transact._id)"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { apiNode } from "boot/apiNode";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useQuasar } from "quasar";

const auth = getAuth();
const $q = useQuasar();
const cartItems = ref([]);

const columns = [
  {
    name: "First_Name",
    label: "First Name",
    field: "First_Name",
    align: "center",
  },
  {
    name: "Last_Name",
    label: "Last Name",
    field: "Last_Name",
    align: "center",
  },
  {
    name: "description",
    label: "Product",
    field: "description",
    align: "center",
  },
  { name: "transact_amount", label: "Price", field: "transact_amount" },
  { name: "quantity", label: "Qty", field: "quantity", align: "center" },
];

const onQtyChange = (item) => {
  if (item.quantity === 0) {
    // remove from cartItems array or send API call to delete
    cartItems.value = cartItems.value.filter((t) => t._id !== item._id);
    // Optional: send DELETE to backend
  }
};

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, t) => {
    const amount = parseFloat(t.transact_amount || 0);
    const qty = parseInt(t.quantity || 1);
    return sum + amount * qty;
  }, 0);
});

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();

        const res = await apiNode.get("/api/transactions/unpaid", {
          headers: { Authorization: `Bearer ${token}` },
        });

        cartItems.value = res.data;
        console.log("✅ Cart items loaded:", res.data);
      } catch (error) {
        console.error("❌ Failed to fetch cart items:", error);
        if (error.response) {
          console.error("📦 Server response:", error.response.data);
        }
      }
    } else {
      console.warn("❌ User not logged in.");
    }
  });
});

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function proceedToCheckout() {
  $q.notify({
    color: "primary",
    message: "Redirecting to checkout...",
  });
  // Redirect or submit to payment route here
}

const downloadInvoice = (transactId) => {
  window.open(
    `${process.env.API}/api/transactions/invoice/${transactId}`,
    "_blank"
  );
};
</script>
