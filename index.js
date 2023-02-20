const {Engine, Render, Runner, World, Bodies, MouseConstraint, Mouse, Body, Events } = Matter; 

function start() {

    const width = window.innerWidth;
    const height = window.innerHeight; 
    const cellsHorizontals = 4; 
    const cellsVertical = 3; 
    const unitLengthX = width / cellsHorizontals; 
    const unitLengthY = height / cellsVertical; 

    const engine = Engine.create(); 
    engine.world.gravity.y = 0;
    const { world } = engine; 
    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            wireframes: false,
            width,
            height
        }
    });

    Render.run(render); 
    Runner.run(Runner.create(), engine); 

    World.add(world, MouseConstraint.create(engine, {
        mouse: Mouse.create(render.canvas)
    })); 

    //Creating the Walls
    const walls = [
        Bodies.rectangle(width * 0.5, 0, width, 2, {isStatic: true}),
        Bodies.rectangle(width * 0.5, height, width, 2, {isStatic: true}),
        Bodies.rectangle(0, height * 0.5, 2, height, {isStatic: true}),
        Bodies.rectangle(width, height * 0.5, 2, height, {isStatic: true})
        
    ];
    World.add(world,walls); 

    //Maze Generation

    const shuffle = (arr) => {
        let counter = arr.length; 

        while(counter > 0){
            const index = Math.floor(Math.random() * counter);
            
            counter--; 

            const temp = arr[counter]; 
            arr[counter] = arr[index];
            arr[index] = temp; 
        }

        return arr; 
    }

    const grid = Array(cellsVertical)
        .fill(null)
        .map(()=> Array(cellsHorizontals).fill(false)); 


    const verticals = Array(cellsVertical)
        .fill(null)
        .map(()=> Array(cellsHorizontals - 1).fill(false)); 

    const horizontals = Array(cellsVertical -1 )
        .fill(null)
        .map(()=> Array(cellsHorizontals).fill(false));


    const startRow = Math.floor(Math.random() * cellsVertical);
    const startColumn = Math.floor(Math.random() * cellsHorizontals);


    const stepThroughCell = (row, column) => {
        
        //If I have visited the cell at [row, column], then return 
        if(grid[row][column]){
            return; 
        }

        //Mark this cell as being visited
        grid[row][column] = true; 
        
        //Assemble randomly-ordererd list of neighbors
        const neighbors = shuffle([
            [row -1, column, 'up'], 
            [row, column + 1, 'right'], 
            [row + 1, column, 'down'],
            [row, column - 1, 'left'],  
        ]);

        //for each neighbor
        for(let neighbor of neighbors){
            const [nextRow, nextColumn, direction] = neighbor;
            
            //See if that neighbor is out of bounds
            if (
                nextRow < 0 || 
                nextRow >= cellsVertical || 
                nextColumn < 0 || 
                nextColumn >= cellsHorizontals 
                ) {
                continue; 
            }
            //If we have visited that neighbor, continue to next neighbor
            if(grid[nextRow][nextColumn]){
                continue; 
            }
            //Remove a wall from either horizontals or verticals

            if(direction === 'left'){
                verticals[row][column -1] = true; 
            } else if (direction === 'right'){
                verticals[row][column] = true; 
            } else if (direction === 'up'){
                horizontals[row - 1][column] = true; 
            } else if (direction === 'down'){
                horizontals[row][column] = true; 
            }
            
            //visit that next cell
            stepThroughCell(nextRow, nextColumn)
        };
    }

    stepThroughCell(startRow, startColumn); 

    //drawing the maze
    horizontals.forEach((row, rowIndex )=> {
        row.forEach((open, columnIndex) => {
            if(open){
                return;
            }
            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX,
                10,
                {
                    label: 'wall',
                    isStatic: true,
                    render: {
                        fillStyle: 'red'
                    }
                }
            ); 
            World.add(world, wall); 
        }); 
    });

    verticals.forEach((row, rowIndex) => {
        row.forEach((open, columnIndex) => {
            if(open){
                return; 
            }
            const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                10,
                unitLengthY,
                {
                    label:'wall',
                    isStatic: true,
                    render : {
                        fillStyle: 'red'
                    }
                }
            );
            World.add(world, wall); 
        });
    });

    // goal
    const goal = Bodies.rectangle(
        width - unitLengthX / 2,
        height - unitLengthY / 2,
        unitLengthX * 0.7,
        unitLengthY * 0.7,
        {
            isStatic: true,
            label: 'goal',
            render: {
                fillStyle : 'green'
            }
        }
    );

    World.add(world,goal);

    //Ball
    const ballRadius = Math.min(unitLengthX, unitLengthY) / 4; 
    const ball = Bodies.circle(
        unitLengthX / 2,
        unitLengthY / 2,
        ballRadius,
        {
            label: 'ball',
            render: {
                fillStyle: 'blue'
            }
        }
    );

    World.add(world, ball);

    //events for ball movement
    document.addEventListener('keydown', keyBoardEvent => {
        const {x, y} = ball.velocity; 
        if(keyBoardEvent.code === 'ArrowUp' ){
            Body.setVelocity(ball, { x , y: y - 5 }); 
        }
        if(keyBoardEvent.code === 'ArrowDown' ){
            Body.setVelocity(ball, { x , y: y + 5 }); 
        }
        if(keyBoardEvent.code === 'ArrowRight' ){
            Body.setVelocity(ball, { x: x + 5, y }); 
            
        }
        if(keyBoardEvent.code === 'ArrowLeft' ){
            Body.setVelocity(ball, { x: x - 5, y });
        }
    });

    //Win condition
    Events.on(engine, 'collisionStart', event => {
        event.pairs.forEach(collision => {
            const labels = ['ball', 'goal'];

            if(labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)){
                world.gravity.y = 1;

                //win message
                document.querySelector('.winner').classList.remove('hidden');
                const button = document.querySelector('button'); 
                
                button.addEventListener('click', event => {

                    event.preventDefault();

                    World.clear(world); 
                    Engine.clear(engine); 
                    // Render.canvas.remove(); 

                    document.querySelector('.winner').classList.add('hidden'); 
                    start(); 
                }); 

                world.bodies.forEach( b => {
                    if(b.label ==='wall'){
                        Body.setStatic(b, false); 
                    }
                });
            }
        });
    });
}

start(); 
