import { BoxGeometry, Geometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial,
    PerspectiveCamera, Raycaster, Scene, WebGLRenderer, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import NetworkNode from './network-node'
import NetworkPacket from './network-packet'
import Pipe from './pipe'
import Point from './point'
import TcpConnection from './tcp-connection'

const PACKET_MATERIAL = new MeshBasicMaterial( { color: "#FFFFFF" } );
const NODE_MATERIAL = new MeshBasicMaterial( { color: "#0088AA" } );
const HOST_MATERIAL = new MeshBasicMaterial( { color: "#00FFFF" } );
const PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FFFF" })
const TCP_PIPE_MATERIAL = new LineBasicMaterial({ color: "#FF0000" })
const TCP_HOST_MATERIAL = new MeshBasicMaterial({ color: "#FF0000" })
const APP_PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FF00" })
const APP_HOST_MATERIAL = new MeshBasicMaterial({ color: "#00FF00" })

let PACKET = new Mesh(new BoxGeometry(8, 8, 8), PACKET_MATERIAL)
let ROUTER = new Mesh(new BoxGeometry( 1, 1, 1 ), NODE_MATERIAL);
let HOST = new Mesh(new BoxGeometry( 1, 1, 1 ), HOST_MATERIAL);

const loader = new OBJLoader();
loader.load(
    'models/router.obj',
    (model) => {
        ROUTER = <Mesh>model.children[0];
        ROUTER.material = NODE_MATERIAL;
    }
);
loader.load(
    'models/host.obj',
    (model) => {
        HOST = <Mesh>model.children[0];
        HOST.material = HOST_MATERIAL;
    }
)

const mouse = {
    x: 0,
    y: 0,
}

const WIDTH = window.innerWidth * 2 / 3;
const HEIGHT = window.innerHeight;
const APP_TIMER = 30;

type Selection = {
    tag: 'app';
    tcp: TcpConnection;
} | {
    tag: 'tcp';
    packet: NetworkPacket;
    tcp: TcpConnection;
} | {
    tag: 'net';
    packet: NetworkPacket;
    pipe: Pipe;
};

class Renderer {
    scene: Scene;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    gfx: WebGLRenderer;
    raycaster: Raycaster;
    selected?: Selection;

    constructor() {
        // Create an empty scene
        this.scene = new Scene();

        // Create a basic perspective camera
        this.camera = new PerspectiveCamera( 75, WIDTH / HEIGHT, 1, 10000 );
        this.controls = new OrbitControls(this.camera);
        this.camera.position.set(0, 500, 0);
        this.controls.update();

        this.gfx = new WebGLRenderer({antialias:true});
        this.gfx.setClearColor("#000000");
        this.gfx.setSize(WIDTH, HEIGHT);
        this.gfx.domElement.onmousemove = (evt) => {
            mouse.x = ( evt.clientX / WIDTH ) * 2 - 1;
            mouse.y = - ( evt.clientY / HEIGHT ) * 2 + 1;
        }

        const container = document.getElementById('container')!;
        container.appendChild( this.gfx.domElement );

        this.raycaster = new Raycaster();
    }

    render() {
        this.controls.update();

        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(mouse, this.camera);

        // calculate objects intersecting the picking ray
        this.raycaster.intersectObjects(this.scene.children).forEach(child => {
            const mesh = <Mesh>child.object;
            if(mesh.geometry.id == PACKET.geometry.id) {
                mesh.material = HOST_MATERIAL;
                this.selected = <Selection>child.object.userData;
            }
        });
        if(this.selected) {
            const overlay = document.getElementById('overlay')!;//.innerHTML = child.object.userData.tag;
            if(this.selected.tag == 'app') {
                overlay.innerHTML = `
                <tr>
                    <th> Message </th>
                </tr>
                <tr>
                    <td> ${this.selected.tcp.send_buffer} </td>
                </tr>
                `
            } else if(this.selected.tag == 'tcp') {

            } else if(this.selected.tag == 'net') {
                const packet = this.selected.packet;
                overlay.innerHTML = `
                <tr>
                    <th> Src </th>
                    <th> Dest </th>
                    <th> Age </th>
                    <th> Progress </th>
                </tr>
                <tr>
                    <td> ${packet.source.toString()} </td>
                    <td> ${packet.dest.toString()} </td>
                    <td> ${packet.distanceTraveled} </td>
                    <td> ${packet.progress === 0 ? 'Complete' : packet.progress} </td>
                </tr>
                `
            }
        }

        // Render the scene
        this.gfx.render(this.scene, this.camera);
    }

    updateSimulation(root: NetworkNode) {
        this.scene.children.forEach(mesh => {
            (<Mesh>mesh).geometry.dispose();
            this.scene.remove(mesh);
        })
        this.addNode(root)
    }

    addNode(root: NetworkNode) {
        // Create a Cube Mesh with basic material
        this.addMesh(root.children.length > 0 ? ROUTER : HOST, root.pos);

        if(root.parent) {
            this.addPipe(root.parent)
        }
        root.children.forEach((pipe) => {
            this.addPipe(pipe);
            this.addNode(pipe.end);
        });
        root.peers.forEach((pipe) => {
            this.addPipe(pipe);
        })
    }

    addPipe(pipe: Pipe) {
        this.addLine(pipe, PIPE_MATERIAL);
        pipe.networkPackets.forEach(packet => this.addPacket(packet.progress, pipe, { tag: 'net', packet, pipe }));
    }

    addTcpPipe(tcp: TcpConnection, time: number) {
        const TCP_Z = 50;

        this.addLine(tcp.pipe, TCP_PIPE_MATERIAL, TCP_Z);
        this.addMesh(HOST, tcp.pipe.start.pos, TCP_HOST_MATERIAL, TCP_Z);
        this.addMesh(HOST, tcp.pipe.end.pos, TCP_HOST_MATERIAL, TCP_Z);

        tcp.pipe.networkPackets.forEach(packet => this.addPacket(packet.distanceTraveled, tcp.pipe, { tag: 'tcp', tcp, packet }, TCP_Z));

        const APP_Z = 100;

        this.addLine(tcp.pipe, APP_PIPE_MATERIAL, APP_Z);
        this.addMesh(HOST, tcp.pipe.start.pos, APP_HOST_MATERIAL, APP_Z);
        this.addMesh(HOST, tcp.pipe.end.pos, APP_HOST_MATERIAL, APP_Z);

        if(tcp.send_buffer.length > 0 && tcp.sent_data / tcp.send_buffer.length < 1) {
            this.addPacket(tcp.sent_data / tcp.send_buffer.length * tcp.pipe.length * (time % APP_TIMER) / APP_TIMER, tcp.pipe, { tag: 'app', tcp }, APP_Z);
        }
    }

    addPacket(progress: number, pipe: Pipe, data: Selection, z?: number) {
        const start = pointToVec(pipe.start.pos, z);
        const end = pointToVec(pipe.end.pos, z);
        const position = start.lerp(end, progress / pipe.length);

        /*
         TODO: check if it's selected
         let mesh;

        if(this.selection) {
            if(this.selection.tag == 'app') {

            } else if(this.selection.tag == 'tcp') {

            } else if(this.selection.tag == 'net') {
                mesh = ()
            }
        }
        if(!this.selection) {
            mesh = PACKET;
        } else if(this.selection.tag == 'app') {

        } else if(this.selec)*/

        const packetMesh = new Mesh(PACKET.geometry, PACKET.material);
        packetMesh.userData = data;
        translateMesh(packetMesh, position);

        this.scene.add(packetMesh);
    }

    addLine(pipe: Pipe, material: LineBasicMaterial, z?: number) {
        const points = new Geometry();
        points.vertices.push(pointToVec(pipe.start.pos, z));
        points.vertices.push(pointToVec(pipe.end.pos, z));
        this.scene.add(new Line(points, material));
    }

    addMesh(source: Mesh, point: Point, material?: MeshBasicMaterial, z?: number) {
        let mesh = new Mesh(source.geometry, material || source.material);
        translateMesh(mesh, pointToVec(point, z));
        this.scene.add(mesh);
    }
}

function translateMesh(mesh: Mesh, vec: Vector3) {
    mesh.translateX(vec.x);
    mesh.translateY(vec.y);
    mesh.translateZ(vec.z);
}

function pointToVec(point: Point, z?: number) {
    return new Vector3(point.x, z || 0, -point.y);
}

export default Renderer
