import { expose } from 'comlink';

interface Point {
  x: number;
  y: number;
}

interface RenderPoint extends Point {
  char: string;
  color: string;
}

interface Line {
  start: Point;
  end: Point;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

interface Box {
  start: Point;
  end: Point;
  filled: boolean;
  color?: string;
  fillColor?: string;
}

interface TextElement {
  position: Point;
  content: string;
  fontSize: number;
  color?: string;
}

const worker = {
  calculateLinePoints(start: Point, end: Point, color: string): RenderPoint[] {
    // Log the input points (which should now be integers)
    console.log(`calculateLinePoints START: (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);

    const points: RenderPoint[] = [];
    let x1 = start.x; // Use directly, they are already floored
    let y1 = start.y;
    const x2 = end.x;
    const y2 = end.y;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let stepCount = 0; // Add step counter for debugging

    while (true) {
      let char = ' ';
      // Determine character based on overall slope (can be refined later)
      if (dx > dy) {
        char = '─';
      } else if (dy > dx) {
               char = '│';
             } else {
               char = (sx === sy) ? '\\' : '/';
             } // Simplified diagonal for now

      // Log the point being generated in this specific line calculation
      console.log(`  calculateLinePoints STEP ${stepCount++}: Adding point (${x1}, ${y1}) char='${char}'`);

      points.push({ x: x1, y: y1, color: color || '#000000', char });

      if (x1 === x2 && y1 === y2) {
        break;
      }
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }

    // Log the total points generated
    console.log(`calculateLinePoints END: ${points.length} points generated`);

    return points;
  },

  calculateBoxPoints(box: Box): RenderPoint[] {
    const points: RenderPoint[] = [];
    const minX = Math.floor(Math.min(box.start.x, box.end.x));
    const maxX = Math.floor(Math.max(box.start.x, box.end.x));
    const minY = Math.floor(Math.min(box.start.y, box.end.y));
    const maxY = Math.floor(Math.max(box.start.y, box.end.y));
    const color = box.color || '#000000';
    const fillColor = box.fillColor || color;

    if (box.filled) {
      const char = '█';
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          points.push({ x, y, color: fillColor, char });
        }
      }
    } else {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          let char = '';
          if (x === minX && y === minY) {
            char = '┌';
          } else if (x === maxX && y === minY) {
            char = '┐';
          } else if (x === minX && y === maxY) {
            char = '└';
          } else if (x === maxX && y === maxY) {
            char = '┘';
          } else if (y === minY || y === maxY) {
            char = '─';
          } else if (x === minX || x === maxX) {
            char = '│';
          }

          if (char) {
            points.push({ x, y, color, char });
          }
        }
      }
    }
    return points;
  },

  batchProcessElements(
    lines: Line[],
    boxes: Box[],
    textElements: TextElement[]
  ): {
    points: RenderPoint[];
    text: TextElement[];
  } {
    console.log('batchProcessElements START');
    const linePointsArray: RenderPoint[] = [];
    const boxPointsArray: RenderPoint[] = [];

    lines.forEach((line, index) => {
      console.log(`Generating points for line ${index}...`);
      const points = this.calculateLinePoints(line.start, line.end, line.color || '#000000');
      linePointsArray.push(...points);
      console.log(` -> Generated ${points.length} points for line ${index}`);
    });

    boxes.forEach((box, index) => {
      console.log(`Generating points for box ${index}...`);
      const points = this.calculateBoxPoints(box);
      boxPointsArray.push(...points);
      console.log(` -> Generated ${points.length} points for box ${index}`);
    });

    const pointMap = new Map<string, RenderPoint>();
    const cornerChars = '┌┐└┘';
    const edgeChars = '─│';
    const junctionChars = '├┤┬┴┼';

    // Process LINE points first, adding them to the map
    console.log('Processing LINE points...');
    linePointsArray.forEach(point => {
        const x = Math.floor(point.x);
        const y = Math.floor(point.y);
        const key = `${x},${y}`;
        // console.log(`  Line Point Key Generation: Original=(${point.x},${point.y}), Floored=(${x},${y}), Key='${key}'`);
        const existingPoint = pointMap.get(key);

        if (existingPoint) {
            console.log(`  Conflict Detected (Line): Existing='${existingPoint.char}', Incoming='${point.char}'`);

            // *** Original Merge Logic with Debugging ***
            let mergedChar = point.char; // Start with the incoming character
            const existingIsCorner = cornerChars.includes(existingPoint.char);
            const incomingIsCorner = cornerChars.includes(point.char);
            const existingIsEdge = edgeChars.includes(existingPoint.char);
            const incomingIsEdge = edgeChars.includes(point.char);
            const existingIsJunction = junctionChars.includes(existingPoint.char);
            const incomingIsJunction = junctionChars.includes(point.char);

            console.log(`    Types: Existing(Corner:${existingIsCorner}, Edge:${existingIsEdge}, Junc:${existingIsJunction}), Incoming(Corner:${incomingIsCorner}, Edge:${incomingIsEdge}, Junc:${incomingIsJunction})`);

            if (existingPoint.char === point.char) {
                console.log("    Condition: Same char");
                mergedChar = point.char;
            } else if (existingIsCorner && !incomingIsCorner) {
                console.log("    Condition: Existing Corner, Incoming Not Corner");
                if (existingPoint.char === '┌' && point.char === '│') { mergedChar = '├'; }
                else if (existingPoint.char === '┌' && point.char === '─') { mergedChar = '┬'; }
                else if (existingPoint.char === '┐' && point.char === '│') { mergedChar = '┤'; }
                else if (existingPoint.char === '┐' && point.char === '─') { mergedChar = '┬'; }
                else if (existingPoint.char === '└' && point.char === '│') { mergedChar = '├'; }
                else if (existingPoint.char === '└' && point.char === '─') { mergedChar = '┴'; }
                else if (existingPoint.char === '┘' && point.char === '│') { mergedChar = '┤'; }
                else if (existingPoint.char === '┘' && point.char === '─') { mergedChar = '┴'; }
                else { mergedChar = existingPoint.char; } // Default keep existing if specific merge not found
            } else if (!existingIsCorner && incomingIsCorner) {
                console.log("    Condition: Incoming Corner, Existing Not Corner");
                if (point.char === '┌' && existingIsEdge && existingPoint.char === '│') { mergedChar = '├'; }
                else if (point.char === '┌' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┬'; }
                else if (point.char === '┐' && existingIsEdge && existingPoint.char === '│') { mergedChar = '┤'; }
                else if (point.char === '┐' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┬'; }
                else if (point.char === '└' && existingIsEdge && existingPoint.char === '│') { mergedChar = '├'; }
                else if (point.char === '└' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┴'; }
                else if (point.char === '┘' && existingIsEdge && existingPoint.char === '│') { mergedChar = '┤'; }
                else if (point.char === '┘' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┴'; }
                else if (existingIsJunction) { mergedChar = '┼'; } // Junction overrides incoming corner
                else { mergedChar = point.char; } // Default use incoming if specific merge not found
            } else if (existingIsCorner && incomingIsCorner) {
                 console.log("    Condition: Both Corners");
                 mergedChar = point.char; // Let the last drawn corner win (arbitrary, maybe refine?)
            } else { // Both are edges or junctions, or combinations
                console.log("    Condition: Edge/Junction combinations");
                 const existing = existingPoint.char;
                 const incoming = point.char;
                 // Default to incoming, overwrite with specific merges
                 mergedChar = incoming;

                 if (existingIsEdge && incomingIsEdge) {
                     console.log("      Sub: Both Edges");
                     if ((existing === '─' && incoming === '│') || (existing === '│' && incoming === '─')) {
                         mergedChar = '┼';
                     }
                 }
                 else if (existingIsJunction && incomingIsEdge) {
                     console.log("      Sub: Existing Junction, Incoming Edge");
                     if (existing === '├' && incoming === '─') { mergedChar = '┼'; }
                     else if (existing === '┤' && incoming === '─') { mergedChar = '┼'; }
                     else if (existing === '┬' && incoming === '│') { mergedChar = '┼'; }
                     else if (existing === '┴' && incoming === '│') { mergedChar = '┼'; }
                     else if (existing === '┼') { mergedChar = '┼'; }
                     else { mergedChar = existing; } // Keep existing junction if incoming edge doesn't make a cross
                 }
                 else if (existingIsEdge && incomingIsJunction) {
                     console.log("      Sub: Existing Edge, Incoming Junction");
                     if (incoming === '├' && existing === '─') { mergedChar = '┼'; }
                     else if (incoming === '┤' && existing === '─') { mergedChar = '┼'; }
                     else if (incoming === '┬' && existing === '│') { mergedChar = '┼'; }
                     else if (incoming === '┴' && existing === '│') { mergedChar = '┼'; }
                     else if (incoming === '┼') { mergedChar = '┼'; }
                     else { mergedChar = incoming; } // Use incoming junction if existing edge doesn't make a cross
                 }
                 else if (existingIsJunction && incomingIsJunction) {
                     console.log("      Sub: Both Junctions");
                      mergedChar = '┼'; // Always merge junctions to cross
                 }
            }
            console.log(`    -> Merged to '${mergedChar}'`);
            pointMap.set(key, { ...point, x, y, char: mergedChar }); // Use floored coords
        } else {
            pointMap.set(key, { ...point, x, y }); // Use floored coords
        }
    });

    // Process BOX points second, checking against the map
    console.log('Processing BOX points...');
    boxPointsArray.forEach(point => {
        const x = Math.floor(point.x);
        const y = Math.floor(point.y);
        const key = `${x},${y}`;
        // console.log(`  Box Point Key Generation: Original=(${point.x},${point.y}), Floored=(${x},${y}), Key='${key}'`);
        const existingPoint = pointMap.get(key);

        if (existingPoint) {
             console.log(`  Conflict Detected (Box): Existing='${existingPoint.char}', Incoming='${point.char}'`);

             // *** Original Merge Logic with Debugging ***
             let mergedChar = point.char; // Start with the incoming character
             const existingIsCorner = cornerChars.includes(existingPoint.char);
             const incomingIsCorner = cornerChars.includes(point.char);
             const existingIsEdge = edgeChars.includes(existingPoint.char);
             const incomingIsEdge = edgeChars.includes(point.char);
             const existingIsJunction = junctionChars.includes(existingPoint.char);
             const incomingIsJunction = junctionChars.includes(point.char);

             console.log(`    Types: Existing(Corner:${existingIsCorner}, Edge:${existingIsEdge}, Junc:${existingIsJunction}), Incoming(Corner:${incomingIsCorner}, Edge:${incomingIsEdge}, Junc:${incomingIsJunction})`);

             if (existingPoint.char === point.char) {
                 console.log("    Condition: Same char");
                 mergedChar = point.char;
             } else if (existingIsCorner && !incomingIsCorner) {
                 console.log("    Condition: Existing Corner, Incoming Not Corner");
                 if (existingPoint.char === '┌' && point.char === '│') { mergedChar = '├'; }
                 else if (existingPoint.char === '┌' && point.char === '─') { mergedChar = '┬'; }
                 else if (existingPoint.char === '┐' && point.char === '│') { mergedChar = '┤'; }
                 else if (existingPoint.char === '┐' && point.char === '─') { mergedChar = '┬'; }
                 else if (existingPoint.char === '└' && point.char === '│') { mergedChar = '├'; }
                 else if (existingPoint.char === '└' && point.char === '─') { mergedChar = '┴'; }
                 else if (existingPoint.char === '┘' && point.char === '│') { mergedChar = '┤'; }
                 else if (existingPoint.char === '┘' && point.char === '─') { mergedChar = '┴'; }
                 else { mergedChar = existingPoint.char; } // Default keep existing if specific merge not found
             } else if (!existingIsCorner && incomingIsCorner) {
                 console.log("    Condition: Incoming Corner, Existing Not Corner");
                 if (point.char === '┌' && existingIsEdge && existingPoint.char === '│') { mergedChar = '├'; }
                 else if (point.char === '┌' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┬'; }
                 else if (point.char === '┐' && existingIsEdge && existingPoint.char === '│') { mergedChar = '┤'; }
                 else if (point.char === '┐' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┬'; }
                 else if (point.char === '└' && existingIsEdge && existingPoint.char === '│') { mergedChar = '├'; }
                 else if (point.char === '└' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┴'; }
                 else if (point.char === '┘' && existingIsEdge && existingPoint.char === '│') { mergedChar = '┤'; }
                 else if (point.char === '┘' && existingIsEdge && existingPoint.char === '─') { mergedChar = '┴'; }
                 else if (existingIsJunction) { mergedChar = '┼'; } // Junction overrides incoming corner
                 else { mergedChar = point.char; } // Default use incoming if specific merge not found
             } else if (existingIsCorner && incomingIsCorner) {
                 console.log("    Condition: Both Corners");
                 mergedChar = point.char; // Let the last drawn corner win (arbitrary, maybe refine?)
             } else { // Both are edges or junctions, or combinations
                 console.log("    Condition: Edge/Junction combinations");
                 const existing = existingPoint.char;
                 const incoming = point.char;
                 // Default to incoming, overwrite with specific merges
                 mergedChar = incoming;

                 if (existingIsEdge && incomingIsEdge) {
                     console.log("      Sub: Both Edges");
                     if ((existing === '─' && incoming === '│') || (existing === '│' && incoming === '─')) {
                         mergedChar = '┼';
                     }
                 }
                 else if (existingIsJunction && incomingIsEdge) {
                     console.log("      Sub: Existing Junction, Incoming Edge");
                     if (existing === '├' && incoming === '─') { mergedChar = '┼'; }
                     else if (existing === '┤' && incoming === '─') { mergedChar = '┼'; }
                     else if (existing === '┬' && incoming === '│') { mergedChar = '┼'; }
                     else if (existing === '┴' && incoming === '│') { mergedChar = '┼'; }
                     else if (existing === '┼') { mergedChar = '┼'; }
                     else { mergedChar = existing; } // Keep existing junction if incoming edge doesn't make a cross
                 }
                 else if (existingIsEdge && incomingIsJunction) {
                     console.log("      Sub: Existing Edge, Incoming Junction");
                     if (incoming === '├' && existing === '─') { mergedChar = '┼'; }
                     else if (incoming === '┤' && existing === '─') { mergedChar = '┼'; }
                     else if (incoming === '┬' && existing === '│') { mergedChar = '┼'; }
                     else if (incoming === '┴' && existing === '│') { mergedChar = '┼'; }
                     else if (incoming === '┼') { mergedChar = '┼'; }
                     else { mergedChar = incoming; } // Use incoming junction if existing edge doesn't make a cross
                 }
                 else if (existingIsJunction && incomingIsJunction) {
                     console.log("      Sub: Both Junctions");
                     mergedChar = '┼'; // Always merge junctions to cross
                 }
             }
             console.log(`    -> Merged to '${mergedChar}'`);
             pointMap.set(key, { ...point, x, y, char: mergedChar }); // Use floored coords
        } else {
            pointMap.set(key, { ...point, x, y }); // Use floored coords
        }
    });

    console.log('batchProcessElements END');
    return {
      points: Array.from(pointMap.values()),
      text: textElements
    };
  }
};

expose(worker);