import {createOrder,listOwnOrders} from '../../_lib/order-service.js';
export async function onRequestGet(context){return listOwnOrders(context);}
export async function onRequestPost(context){return createOrder(context,'customer');}
