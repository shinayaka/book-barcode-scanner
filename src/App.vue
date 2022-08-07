<template>
  <div>
    <button v-if="started" @click="stopCamera">カメラを停止</button>
    <button v-else @click="startCamera">カメラを起動</button>
  </div>

  <div>
    <template v-if="code">
      <div>読取結果： {{ code }} {{ title }}</div>
      <button @click="searchAmazon">Amazonで検索</button>
      <button @click="searchRakuten">楽天ブックスで検索</button>
      <button @click="clipInfo">クリップボードにコピー</button>
    </template>
  </div>
  <div>
    <div id="barcode-scanner" v-show="started" />
  </div>
</template>

<script setup lang="ts">
import Quagga from "@ericblade/quagga2";
import axios from "axios";
import { ref } from "vue";

const code = ref<string>("");
const title = ref<string>("");
const started = ref<boolean>(false);

const startCamera = () => {
  started.value = true;
  // バーコードリーダー
  Quagga.init(
    {
      locate: true,
      inputStream: {
        name: "Live",
        type: "LiveStream",
        constraints: {
          width: 640,
          height: 140,
        },
        target: document.querySelector("#barcode-scanner"),
      },
      decoder: {
        readers: ["ean_reader"],
        multiple: false,
      },
      locator: {
        halfSample: false,
        patchSize: "medium",
      },
    },
    (err) => {
      if (err) {
        console.log(err);
        return;
      }
      Quagga.start();
      Quagga.onDetected(async (data) => {
        code.value = data.codeResult.code;
        Quagga.stop();
        started.value = false;
        title.value = await fetchBook(code.value);
      });
    }
  );
};
const stopCamera = () => {
  Quagga.stop();
  started.value = false;
};
const clipInfo = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(title.value);
  }
};
const searchAmazon = () => {
  const url = "https://www.amazon.co.jp/s?i=stripbooks&rh=p_66%3A" + code.value;
  openLink(url);
};
const searchRakuten = () => {
  const url = "https://books.rakuten.co.jp/search?g=001&isbnJan=" + code.value;
  openLink(url);
};
const openLink = (url: string) => {
  if (!url) return;
  window.open(url, "_blank");
};
const fetchBook = async (isbn: string) => {
  if (!isbn) return;
  try {
    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes?q=isbn:" +
        isbn +
        "&maxResults=1"
    );
    if (!response || response.data.totalItems === 0) return "No Data";
    title.value = response.data.items[0].volumeInfo.title;
    return response.data.items[0].volumeInfo.title;
  } catch (error) {
    console.error(error);
  }
};
</script>
