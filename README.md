# Network Simulator

Partners: Ryan Cirincione & Ryan Goldstein

## What is the Project?

The project is a network simulator that shows various protocol layers to give the user an idea of how Internet technologies work together.
For ease of implementation and the end user, it is heavily simplified.
At the lowest layer there is a mesh of routers and hosts, which is how the network layer of the OSI model functions.
Each router takes in packets and forwards them along to their destination, with packets moving through a network topology.
The middle layer is the transport layer, which is concerned with sending back and forth data reliably.
If a packet is dropped, it will handle re-sending it.
The top layer is the application layer, which is just concerned with the application. In this example, it's a very simple chat application, powered by very basic chatbots we've created.

## The Live Version

We've hosted a version of the application at https://www.ryanisaacg.com/net-sim

The application requires WebGL support, which should be present on any modern browser.

## Controls

Use left click to orbit, right click to pan, and middle mouse / scroll to zoom.

Use the button to the right of the canvas to pause the simulation.

At any time, but easiest when paused, mouse over a packet to see a display of its values on the right.
Packets from different layers have different types of data!

## How it Was Made

We used Typescript and Three.js, which is a library that handles 3D graphics on the web. The conversations are powered by a basic Markov chain to create a small chatbot.
