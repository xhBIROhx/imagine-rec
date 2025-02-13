import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';
const API_KEY = 'AIzaSyDFqfQXWSojt8U5gKXe2mMVmJePmoLT9gA';

const submitButton = document.querySelector('#submit-look');
const submitColorButton = document.querySelector('#submit-color');
const output = document.querySelector('.output');
const fileInput = document.querySelector("#fileInput");

submitButton.addEventListener('click', function() {
  talkToAPI("Mi látható a képen?")
});

submitColorButton.addEventListener('click', function() {
  talkToAPI("Milyen színű a kép?")
})

fileInput.addEventListener('change', function() {
  document.querySelector("#fileInput-label").textContent = "kiválasztott kép: " + fileInput.files[0].name;
});

async function talkToAPI(question) {
  output.ontent = '...';

  try {
    const file = fileInput.files[0];

    const imageBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
    });

    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
          { text: question }
        ]
      }
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // or gemini-1.5-pro
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }
  } catch (e) {
    if (e = "TypeError: Failed to execute \'readAsDataURL\' on \'FileReader\': parameter 1 is not of type \'Blob\'.") {
      output.innerHTML = "Nincs kép kiválasztva!";
      return;
    }
    output.innerHTML = e;
  }
}