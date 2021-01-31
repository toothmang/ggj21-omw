
class object_pool {
    constructor(scene, mesh_ctor) {
        this.scene = scene;
        //this.object_ctor = object_ctor;
        this.mesh_ctor = mesh_ctor;

        this.active = 0;
        this.length = 0;
        this.meshes = [];
        //this.entities = [];
        this.enabled = [];
        this.paths = []
    }
    new(argpack) {
        for (let i = 0; i < this.length; i++) {
            if (!this.enabled)
            {
                //this.entities[i] = this.object_ctor(argpack);
                this.enabled[i] = true;
                this.paths[i] = (argpack.path);
                this.scene.add(this.meshes[i]);
                this.active += 1;
                return i;
            }
        }

        //this.entities.push(this.object_ctor(argpack));
        this.meshes.push(this.mesh_ctor());
        this.enabled.push(true);
        this.paths.push(argpack.path);
        this.scene.add(this.meshes[this.length]);
        this.length += 1;
        this.active += 1;
        return this.length - 1;
    }
    disable(i) {
        if (i < 0 || this.length <= i) {
            console.log("Attempted to disable element beyond length of object pool!");
            return;
        }

        this.enabled[i] = false;
        this.scene.remove(this.meshes[i]);
        this.active -= 1;
    }
    update(t, progress) {
        for (let i = 0; i < this.enabled.length; i++) {
            if (!this.enabled[i]) continue;

            let pos = this.paths[i](t, progress);
            if (pos.z > 1000) {
                this.disable(i);
            }
            else {
                this.meshes[i].position.x = pos.x;
                this.meshes[i].position.y = pos.y;
                this.meshes[i].position.z = pos.z;
            }

            // if (Math.random() < 0.005) { // Stochastic logging. Use at own risk!
            //     console.log("Object " + i + " has Z coord " + pos.z + " at t=" +t+ " and p=" + progress);
            // }
        }
    }
}
