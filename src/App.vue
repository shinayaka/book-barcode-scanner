<template>
  <div>
    <div class="flex justify-center mb-2">
      <button v-if="started" class="btn btn-primary w-full" @click="stopCamera">
        カメラを停止
      </button>
      <button v-else class="btn btn-primary w-full" @click="startCamera">
        カメラを起動
      </button>
    </div>
    <div v-show="started">
      <div>以下の枠内にバーコードを写してください。</div>
      <div class="barcode-scanner">
        <div class="detect-area" />
      </div>
    </div>

    <div>
      <template v-if="code">
        <div>読取結果</div>
        <div>
          <span>ISBN</span><span class="pl-7">{{ code }}</span>
        </div>
        <div>
          <span>書籍名</span><span class="pl-4">{{ title }}</span>
          <button @click="clipInfo">
            <svg
              class="w-6 h-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path
                d="M7 15h7v2H7zm0-4h10v2H7zm0-4h10v2H7zm12-4h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-.14 0-.27.01-.4.04-.39.08-.74.28-1.01.55-.18.18-.33.4-.43.64-.1.23-.16.49-.16.77v14c0 .27.06.54.16.78s.25.45.43.64c.27.27.62.47 1.01.55.13.02.26.03.4.03h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7-.25c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zM19 19H5V5h14v14z"
              />
            </svg>
          </button>
        </div>
        <button class="btn btn-primary w-full mt-2" @click="searchAmazon">
          Amazonで検索
        </button>
        <button class="btn btn-primary w-full mt-2" @click="searchRakuten">
          楽天ブックスで検索
        </button>
        <button class="btn btn-primary w-full mt-2" @click="searchYodobashi">
          ヨドバシカメラで検索
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import Quagga from "@ericblade/quagga2";
import axios from "axios";
import { ref } from "vue";
import { isIsbn } from "./utils/isbn";

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
          facingMode: "environment",
        },
        target: document.querySelector(".barcode-scanner"),
        area: { top: "30%", right: "10%", left: "10%", bottom: "30%" },
        numOfWorkers: navigator.hardwareConcurrency || 4,
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
        if (isIsbn(data.codeResult.code)) {
          code.value = data.codeResult.code;
          Quagga.stop();
          started.value = false;
          title.value = await fetchBook(code.value);
        }
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
const searchYodobashi = () => {
  const url = "https://www.yodobashi.com/?word=" + code.value;
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
<style scoped lang="scss">
.barcode-scanner {
  margin: auto;
  overflow: hidden;
  height: 200px;
  width: 100%;
  /* relativeに設定 */
  position: relative;

  video,
  canvas {
    width: 100%;
    height: 200px;
  }

  .detect-area {
    position: absolute;
    top: 30%;
    bottom: 30%;
    left: 10%;
    right: 10%;

    border: 2px solid #0000ff;
  }
}
</style>
