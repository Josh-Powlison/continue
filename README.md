<img src="design-files/logo.svg" width="100"><br>[Check out a demo on the website!](https://continue.heybard.com/)<br>[Download the latest version](https://github.com/joshpowlison/continue/releases)

# What is Continue?

Convert money into points for your projects! Set and meet goals and let your audience know where you're at. It's like Kickstarter for your website!

## Measure progress by money earned, not money spent!

That may sound weird, but some simple math will help. The following shows the money received after current Stripe fees for a $1, a $10, and a $100 purchase (2.9% + 30&cent; fee):

```
$1 * .029 - .30 = $0.67
$10 * .029 - .30 = $9.41
$100 * .029 - .30 = $96.80
```

Based on this, let's compare how much you earn after fees for many small purchases vs fewer larger ones:

```
100 $1 purchases: $67.00 earned
10 $10 purchases: $94.10 earned
1 $100 purchase: $96.80 earned
```

Small purchases are great! But we don't receive the same amount. So we need a different model to receive payments with.

## Goals

Set and meet goals! Get emails automatically as goals are met so you can keep up on them.

You can share goals and progress with your audience so they can see where you're all at!

## Payment providers support

Put the relevant PHP packages inside of the `payment-providers` folder and then 

* **Stripe**: Add your API keys to `ajax.php` and download Stripe from https://stripe.com/docs/libraries#php

Make sure in the relevant `*****-payment.php` file that you `require` the correct file!

## Thank you for supporting the open source community, BrowserStack!

[<img src="images/browserstack.svg" width="200">](https://www.browserstack.com/)