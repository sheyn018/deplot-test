import { Request, Response } from "express";

export async function GETSaveCustomer(req: Request, res: Response) {

    const inputVars: any = req.query;
    // const { parkId, shoppingCartUuid } = inputVars;
    try {
        let {
            parkId,
            shoppingCartUuid,
            guestName,
            guestEmail,
            guestPhone,
            shippingName,
            shippingState,
            shippingType,
            shippingCountry,
            shippingCity,
            shippingAddress1,
            shippingPostalCode,
            smsMessage,
            minPayment
        }: any = req.query;
        // if (!parkId || !shoppingCartUuid || !guestName || !guestEmail || !guestPhone || !shippingName || !shippingState || !shippingCountry || !shippingCity || !shippingAddress1 || !shippingPostalCode) {
        //     return res.status(400).send("Missing required parameters");
        // }

        // Decoding the variables
        parkId = decodeURIComponent(parkId);
        shoppingCartUuid = decodeURIComponent(shoppingCartUuid);
        guestName = decodeURIComponent(guestName);
        guestEmail = decodeURIComponent(guestEmail);
        guestPhone = decodeURIComponent(guestPhone);
        shippingName = decodeURIComponent(shippingName);
        shippingState = decodeURIComponent(shippingState);
        shippingType = 'SHIPPING';
        shippingCountry = decodeURIComponent(shippingCountry);
        shippingCity = decodeURIComponent(shippingCity);
        shippingAddress1 = decodeURIComponent(shippingAddress1);
        shippingPostalCode = decodeURIComponent(shippingPostalCode);
        smsMessage = decodeURIComponent(smsMessage);
        minPayment = decodeURIComponent(minPayment);

        // First API call: save customer details
        const saveCustomerUrl = "https://insiderperks.com/wp-content/endpoints/campspot/save-customer.php";
        const customerData = {
            parkId,
            shoppingCartUuid,
            guestName,
            guestEmail,
            guestPhone,
            shippingName,
            shippingState,
            shippingType,
            shippingCountry,
            shippingCity,
            shippingAddress1,
            shippingPostalCode,
            smsMessage
        };

        console.log(customerData);

        let guestId = '';
        let status = 'failed';

        try {
            const response = await fetch(saveCustomerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });
            const details = await response.json();

            if (response.ok && details.httpCode === 200) {
                status = "success";
                guestId = details.apiResponse.guest.id;
            } else {
                status = "failed";
            }
        }

        catch (error: any) {
            status = error.message;
        }

        // Second API call: calculate subtotal
        const subTotalbaseUrl = "https://insiderperks.com/wp-content/endpoints/campspot/calculate-subtotal.php";

        // Dummy data, replace with dynamic data when needed
        const subTotalparams: any = {
            parkId: parkId,
            cartId: shoppingCartUuid
        };

        let subtotal, finalTotal;

        // Convert the parameters to a query string
        const subTotalqueryString = Object.keys(subTotalparams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(subTotalparams[key])}`)
            .join('&');

        // Append the query string to the URL
        const subTotalurlWithParams = `${subTotalbaseUrl}?${subTotalqueryString}`;
        const subTotalfetchOptions = {
            method: 'POST',
        };

        try {
            const response = await fetch(subTotalurlWithParams, subTotalfetchOptions);
            subtotal = await response.json();

            finalTotal = JSON.parse(subtotal);
            finalTotal = finalTotal.subtotal;
        }

        catch (error) {
            return res.status(500).send(error);
        }

        // Third API call: generate CardConnect URL
        const buildUrlParams: any = {
            parkId: parkId,
            cartId: shoppingCartUuid,
            amount: finalTotal,
            name: guestName,
            email: guestEmail,
            state: shippingState,
            type: "SHIPPING",
            country: shippingCountry,
            city: shippingCity,
            address1: shippingAddress1,
            postal: shippingPostalCode,
            minPayment: minPayment
        };

        const queryString = Object.keys(buildUrlParams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(buildUrlParams[key])}`)
            .join('&');
        const cardConnectUrl = `https://booking-checkoutsummary.onrender.com/booking-checkout.php?${queryString}`;

        return res.send({ status, guestId, finalTotal, cardConnectUrl });
    }

    catch (error) {
        return res.status(500).send("Error processing the request");
    }
}
