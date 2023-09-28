import http from "k6/http";
import { sleep, check } from 'k6';
import { SharedArray } from "k6/data";
import { Trend, Counter } from "k6/metrics";
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { jUnit } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';


const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';

const customers = new SharedArray('all my customers', function () {
    return JSON.parse(open('./customers.json')).customers;
  });
  const pizzas = new Counter('quickpizza_number_of_pizzas');
  const ingredients = new Trend('quickpizza_ingredients');
  const THRESHOLD = __ENV.THRESHOLD || 1000;

export let options = {
    stages: [
      { duration: "5s", target: 10 },
      { duration: "5s", target: 10 },
      { duration: "5s", target: 0 },
    ],
    thresholds: {
        "http_req_duration": [
            http_req_duration: [{ threshold: `p(95)<${THRESHOLD}`, abortOnFail: true }],
        ],
      },
  };

  export function setup() {
    let res = http.get(BASE_URL)
    if (res.status !== 200) {
      throw new Error(`Got unexpected status code ${res.status} when trying to setup. Exiting.`)
    }  
  }
export default function () {
  let restrictions = {
    maxCaloriesPerSlice: 500,
    mustBeVegetarian: false,
    excludedIngredients: ["pepperoni"],
    excludedTools: ["knife"],
    maxNumberOfToppings: 6,
    minNumberOfToppings: 2
  }
  let res = http.post(`${BASE_URL}/api/pizza`, JSON.stringify(restrictions), {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': customers[Math.floor(Math.random() * customers.length)],
    },
  });

  check(res, {
    "is status 200": (r) => r.status === 200,
  });
// Incrementamos el número de pizzas en 1
pizzas.add(1);

// Añadimos el número de ingredientes de la pizza a la tendencia
ingredients.add(res.json().pizza.ingredients.length);
  console.log(`${res.json().pizza.name} (${res.json().pizza.ingredients.length} ingredients)`);
  sleep(1);

}

export function teardown(data) {
    // 4. código de finalización
  }

  export function handleSummary(data) {
    return {
      'stdout': textSummary(data, { indent: ' ', enableColors: true }), // Show the text summary to stdout...
      'junit.xml': jUnit(data), // Transform summary and save it as a JUnit XML...
  
      'summary.json': JSON.stringify(data), //el objeto de datos predeterminado
    };
  }