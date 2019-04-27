import { BoxGeometry, Geometry, Line, LineBasicMaterial, Mesh, MeshBasicMaterial,
    PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import NetworkNode from './network-node'
import Pipe from './pipe'

const NODE_MATERIAL = new MeshBasicMaterial( { color: "#FFFFFF" } );

let ROUTER = new Mesh(new BoxGeometry( 1, 1, 1 ), NODE_MATERIAL);

const loader = new OBJLoader();
loader.load(
    'models/router.obj',
    (model) => {
        ROUTER = <Mesh>model.children[0];
        ROUTER.material = NODE_MATERIAL;
    }
);

const PIPE_MATERIAL = new LineBasicMaterial({ color: "#00FFFF" })

class Renderer {
    scene: Scene;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    gfx: WebGLRenderer;

    constructor() {
        // Create an empty scene
        this.scene = new Scene();

        // Create a basic perspective camera
        this.camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 1, 10000 );
        this.controls = new OrbitControls(this.camera);
        this.camera.position.set(0, 20, 0);
        this.controls.update();

        this.gfx = new WebGLRenderer({antialias:true});
        this.gfx.setClearColor("#000000");
        this.gfx.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.gfx.domElement );
    }

    render() {
        this.controls.update();
        // Render the scene
        this.gfx.render(this.scene, this.camera);
    }

    updateSimulation(root: NetworkNode) {
        this.scene = new Scene();
        this.addNode(root)
    }

    addNode(root: NetworkNode) {
        // Create a Cube Mesh with basic material
        const cube = new Mesh(ROUTER.geometry, ROUTER.material);
        cube.translateX(root.pos.x);
        cube.translateZ(-root.pos.y);

        // Add cube to Scene
        this.scene.add(cube);

        root.children.forEach((pipe) => {
            this.addPipe(pipe);
            this.addNode(pipe.end);
        });
        root.peers.forEach((pipe) => {
            this.addPipe(pipe);
        })
    }

    addPipe(pipe: Pipe) {
        const start = pipe.start.pos;
        const end = pipe.end.pos;

        const points = new Geometry();
        points.vertices.push(new Vector3(start.x, 0, -start.y));
        points.vertices.push(new Vector3(end.x, 0, -end.y));
        this.scene.add(new Line(points, PIPE_MATERIAL));
    }
}

export default Renderer
