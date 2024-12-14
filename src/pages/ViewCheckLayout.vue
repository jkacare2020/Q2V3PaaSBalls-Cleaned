<template>
  <head>
    <link
      href="https://fonts.googleapis.com/css?family=WindSong&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css?family=Alex+Brush&display=swap"
      rel="stylesheet"
    />
    <link
      href="//db.onlinewebfonts.com/c/cd43da0adfeb9d2d7e1923cb2c8b08eb?family=MICR"
      rel="stylesheet"
      type="text/css"
    />
  </head>

  <div class="container" style="margin-top: -50px">
    <div
      class="box"
      style="width: 8.35in; height: 330px; background-color: azure"
    >
      <div class="columns">
        <!-------------------------------Column 1------------------------------------------------->
        <div class="column">
          <!-- Cust name input -->

          <p
            type="text"
            style="text-transform: capitalize; font-size: 14px; height: 14px"
          >
            {{ `${transactInfo.custFirstName} ${transactInfo.custLastName} ` }}
          </p>

          <p
            name="Payer_address"
            id="Payer_address"
            style="text-transform: capitalize; font-size: 14px; height: 14px"
          >
            {{ transactInfo.custAdd }}
          </p>

          <p
            type="text"
            style="text-transform: capitalize; font-size: 14px; height: 14px"
          >
            {{
              `${transactInfo.custCity}, ${transactInfo.custState} ${transactInfo.custZip} `
            }}
          </p>

          <span style="text-transform: capitalize; font-size: 14px">{{
            transactInfo.custPhone
          }}</span>
          <span style="text-transform: capitalize; font-size: 10px">
            Tran-ID# {{ transactInfo.timeStamp }}</span
          >
        </div>
        <!-------------------------------Column 2------------------------------------------------->
        <div class="column" style="margin-left: 200px">
          <!-- Bank name input -->

          <p
            style="
              text-transform: capitalize;
              font-size: 14px;
              font-weight: 600;
              height: 14px;
              margin-left: 200px;
            "
          >
            No.{{ transactInfo.checkNumber }}
          </p>
          <!-----------ID # -->
          <p
            name="bank_name"
            id="bank_name"
            style="text-transform: capitalize; font-size: 14px; height: 14px"
          >
            {{ transactInfo.bankName }}
          </p>
          <p style="text-transform: capitalize; font-size: 14px; height: 14px">
            {{ transactInfo.bankAdd }}
          </p>
          <!-- <span style="font-size:x-small; margin-left: 50px; height: 14px">ID. {{transactInfo.timeStamp}}</span>     -->
          <!--------------------------------------city State---------------------------------->
          <p style="text-transform: capitalize; font-size: 14px; height: 14px">
            {{
              `${transactInfo.bankCity}, ${transactInfo.bankState} ${transactInfo.bankZip} `
            }}
          </p>
          <!------------------------------------------------------------------------------------>
          <div style="color: black">
            <!-- <span style="text-transform: capitalize; font-size: 14px;"  >{{transactInfo.custPhone  }}</span> -->
            <span style="display: inline-block; font-size: 15px"
              >Date {{ transactInfo.tranDate }}
            </span>
          </div>
        </div>
      </div>

      <!-- </div>  -->

      <div
        class="check amout"
        style="color: black; font-size: 15px; margin-left: 38px"
      >
        Pay To The
      </div>
      <input
        class="input-data"
        style="color: black; font-size: 15px; margin-left: 50px"
        maxlength="100"
        size="80"
        value="Order Of ***D.M.LLC."
      /><font style="font-size: 14px">$</font>
      <span
        class="amount"
        type="text"
        name="numberInput"
        id="numberInput"
        style="color: black; font-size: 15px"
      >
        {{ transactInfo.transactAmount }}
      </span>
      <br />
      <div class="amount">
        <input
          id="word"
          class="input-data"
          name="result0"
          size="65"
          style="direction: rtl; font-size: 15px; margin-left: 10px"
          :value="amountInWords"
          readonly
        />
        <!-- <span style="display:inline-block; width:200px;" > -->
        <input
          class="input-data"
          maxlength="10"
          style="direction: rtl; font-size: 15px"
          size="25"
          value="Dollars"
        />
        <!-- </span> -->
      </div>
      <!------------------------------------colum 3------------>
      <div class="column">
        <!-- Bank name input -->
        <div class="field">
          <p
            style="color: black; display: block; font-size: 14px; height: 14px"
          >
            Dataset Management LLC
          </p>
          <p
            style="color: black; display: block; font-size: 14px; height: 14px"
          >
            8840 Warner Ave. Ste 302
          </p>
          <p
            style="color: black; display: block; font-size: 14px; height: 14px"
          >
            Fountain Valley, CA 92708
          </p>
          <!-- <span style="color:black; display:block; font-size:15px; height: 25px">(714) 848-0228 D.M.L</span> -->
        </div>
        <div style="color: black; font-size: 14px" id="sig1">
          Memo:
          <input
            class="input-data"
            style="font-size: smaller"
            size="22"
            v-model="transactInfo.transactDescript"
          />
          <span style="display: inline-block; width: 250px"></span>
          <span style="color: black; font-size: smaller">
            E.Signature: &nbsp;&nbsp;
            <span
              class="signature"
              style="color: black; font-size: larger"
              id="sig2"
            >
              <a href="#" @click="printForm()">
                <span
                  class="signature"
                  maxlength="28"
                  :value="`${transactInfo.custFirstName} ${transactInfo.custLastName} `"
                  @input="updateNames($event.target.value)"
                  >{{
                    `${transactInfo.custFirstName} ${transactInfo.custLastName} `
                  }}</span
                >
              </a>
            </span>
          </span>
        </div>
        <div
          class="card-text mb-2"
          id="bank_info"
          style="margin-top: 10px; margin-bottom: 100px"
        >
          <span style="display: inline-block; width: 100px"></span>
          <!-- <input class="micr-input" style="font-weight:900;" id="check#1" maxlength="11" size="11" :value="formattedCheckNumber"> -->
          <span
            class="micr-input"
            style="font-weight: 900"
            maxlength="14"
            size="12"
            >{{ formattedRoutNumber }}</span
          >
          <span
            class="micr-input"
            maxlength="21"
            size="21"
            style="font-weight: 900; margin-left: 45px"
            >{{ formattedAccountNumber }}</span
          >
          <span
            class="micr-input"
            style="font-weight: 900; margin-left: 100px"
            id="check#1"
            maxlength="11"
            size="11"
          >
            {{ formattedCheckNumber }}</span
          >
        </div>
      </div>
    </div>
  </div>

  <button class="hide-on-print" @click="reloadPage">Reload Page</button>
</template>

<script>
export default {
  methods: {
    printForm() {
      window.print();
      // Perform any additional actions after printing the form
    },
  },
};
</script>

<script setup>
import { ref, onMounted, computed } from "vue";
// import { useStoreTransacts } from "@/stores/storeTransacts";
// import { useWatchCharacters } from '@/use/useWatchCharacters'
import { useRouter } from "vue-router";

const props = defineProps({
  reload: {
    type: Boolean,
    default: false,
  },
});

onMounted(() => {
  if (props.reload) {
    window.location.reload();
  }
});

function reloadPage() {
  window.location.reload();
}

//-------------------reload-----------------------------------
const storeTransacts = "useStoreTransacts();";
const router = useRouter();
const transactId = router.currentRoute.value.params.transactId;

const showNavbar = ref(false); // Set this to true to show the navbar or false to hide it

//--transact Info initialization to handle the case when storeTransact.transactInfo is undefined.
const transactInfo = ref(
  storeTransacts.transactInfo || {
    custFirstName: "",
    custLastName: "",
    custAdd: "",
    custCity: "",
    custState: "",
    custZip: "",
    custPhone: "",
    custEmail: "",
    bankName: "",
    bankAdd: "",
    bankCity: "",
    bankState: "",
    bankZip: "",
    bankRout: "",
    bankAccount: "",
    checkNumber: "",
    transactAmount: 0,
    transactDescript: "",
    transactStatus: "",
    holderFirstName: "",
    holderLastName: "",
    holderPhone: "",
    holderEmail: "",
    timeStamp: "",
    tranDate: "",
  }
);

/*
check number routing number and account number
*/

const formattedCheckNumber = computed(
  () => `C${transactInfo.value.checkNumber}C`
);
const formattedRoutNumber = computed(() => `A${transactInfo.value.bankRout}A`);
const formattedAccountNumber = computed(
  () => `    ${transactInfo.value.bankAccount}C`
);

// Fetch the Transact information when the component is mounted

onMounted(async () => {
  await storeTransacts.fetchTransactInfo(transactId);
  const fetchedTransactInfo = storeTransacts.transactInfo;

  // Extract the desired properties from the tranInfo object

  transactInfo.value = {
    custFirstName: fetchedTransactInfo.tranFirst || "",
    custLastName: fetchedTransactInfo.tranLast || "",
    custAdd: fetchedTransactInfo.address || "",
    custCity: fetchedTransactInfo.city || "",
    custState: fetchedTransactInfo.state || "",
    custZip: fetchedTransactInfo.zip || "",
    custPhone: fetchedTransactInfo.phone || "",
    custEmail: fetchedTransactInfo.email || "",
    bankName: fetchedTransactInfo.bank || "",
    bankAdd: fetchedTransactInfo.bankAdd || "",
    bankCity: fetchedTransactInfo.bankCity || "",
    bankState: fetchedTransactInfo.bankState || "",
    bankZip: fetchedTransactInfo.bankZip || "",
    bankRout: fetchedTransactInfo.routing || "",
    bankAccount: fetchedTransactInfo.account || "",
    transactAmount: fetchedTransactInfo.amount || 0,
    transactDescript: fetchedTransactInfo.description || "",
    transactStatus: fetchedTransactInfo.status || "",
    checkNumber: fetchedTransactInfo.checkNumber || "",
    holderFirstName: fetchedTransactInfo.holderFirstName || "",
    holderLastName: fetchedTransactInfo.holderLastName || "",
    holderPhone: fetchedTransactInfo.holderPhone || "",
    holderEmail: fetchedTransactInfo.holderEmail || "",
    timeStamp: fetchedTransactInfo.timeStamp || "",
    tranDate: fetchedTransactInfo.date || "",
  };
});

// // Method to close the update success message
// const closeUpdateSuccess = () => {
//   showUpdateSuccess.value = false;
// };

/*
Dollar amount to words
*/
const amountInWords = computed(() =>
  convertAmountToWords(transactInfo?.value.transactAmount)
);

function convertAmountToWords(amount) {
  if (typeof amount !== "undefined") {
    const amountParts = amount.toString().split(".");
    const dollars = parseInt(amountParts[0]);
    const cents = parseInt(amountParts[1]) || 0;
  }

  const numberWords = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tensWords = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const denom = ["", "Thousand", "Million", "Billion", "Trillion"];

  const amountParts = amount.toString().split(".");
  const dollars = parseInt(amountParts[0]);
  const cents = parseInt(amountParts[1]) || 0;

  const dollarsInWords = convertNumberToWords(
    dollars,
    numberWords,
    tensWords,
    denom
  );
  const centsInWords = convertCentsToWords(cents, numberWords, tensWords);

  const converted = `${dollarsInWords} dollars and ${centsInWords} cents`;
  return converted;
}

function convertNumberToWords(number, numberWords, tensWords, denom) {
  if (number === 0) return "Zero";

  let words = "";
  let numStr = "";

  if (number < 0) {
    number = Math.abs(number);
    numStr = "Negative";
  }

  if (number < 20) {
    words = numberWords[number];
  } else if (number < 100) {
    words = tensWords[Math.floor(number / 10)];
    if (number % 10 !== 0) {
      words += "-" + numberWords[number % 10];
    }
  } else if (number < 1000) {
    words = numberWords[Math.floor(number / 100)] + " Hundred";
    if (number % 100 !== 0) {
      words +=
        " " + convertNumberToWords(number % 100, numberWords, tensWords, denom);
    }
  } else {
    let denomIndex = 0;
    while (number > 0) {
      if (number % 1000 !== 0) {
        const temp = convertNumberToWords(
          number % 1000,
          numberWords,
          tensWords,
          denom
        );
        words = temp + " " + denom[denomIndex] + " " + words;
      }
      number = Math.floor(number / 1000);
      denomIndex++;
    }
  }

  return numStr + " " + words;
}

function convertCentsToWords(cents, numberWords, tensWords) {
  if (cents === 0) return "Zero";

  let words = "";
  if (cents < 20) {
    words = numberWords[cents];
  } else if (cents < 100) {
    words = tensWords[Math.floor(cents / 10)];
    if (cents % 10 !== 0) {
      words += "-" + numberWords[cents % 10];
    }
  } else {
    words = "Number out of range";
  }

  return words;
}

// ...
</script>

<style>
/*

@import url(//db.onlinewebfonts.com/c/cd43da0adfeb9d2d7e1923cb2c8b08eb?family=MICR);

@font-face {font-family: "MICR"; src: url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.eot"); 
                                 src: url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.eot?#iefix") format("embedded-opentype"), 
                                      url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.woff2") format("woff2"), 
                                      url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.woff") format("woff"), 
                                      url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.ttf") format("truetype"), 
                                      url("//db.onlinewebfonts.com/t/cd43da0adfeb9d2d7e1923cb2c8b08eb.svg#MICR") format("svg"); }

*/

.signature {
  outline: 0;
  font-family: "WindSong", cursive;
  font-weight: 900;
  color: black;
}
/*
@font-face {
  font-family: 'MICRFont';
  src: url('/fonts/MICR-Regular.ttf') format('truetype');
}
*/

@font-face {
  font-family: "MICR";
  src: url("/fonts/micrenc.ttf") format("truetype");
}

/* .micr-input {
  font-size:36px
}
 */

.micr-input {
  outline: 0;
  /* font-family: MICR; */
  font-family: "MICR", sans-serif;
  font-size: 24px;
  font-weight: 900;
  color: black;
}

.input-data {
  outline: 0;
  border-width: 0 0 2px;
  border-color: blue;
}
.amount {
  border-color: black;
  font-weight: 600;
}

/* print form and hide button here */
@media print {
  .hide-on-print {
    display: none;
  }
}
</style>
