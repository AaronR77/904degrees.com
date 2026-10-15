import {createOrder} from '../../_lib/order-service.js';
export async function onRequestPost(context){return createOrder(context,'showroom');}
