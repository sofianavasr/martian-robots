
const fs = require('fs')
const readline = require('readline')

module.exports = { main, validOrientation, initWorldDimensions, buildRobotWithPosition, turnRight, turnLeft, goForward }

const north = 'N'
const south = 'S'
const west = 'W'
const east = 'E'
const left = 'L'
const right = 'R'
const forward = 'F'
const scentedRef = -1
const lost = 'LOST'
const worldDimensionsLine = 0
const robotPositionLine = 1
const robotInstructionsLine = 2
const coordinateLimit = 50
const instructionsLimit = 100

var defaultInputFile = './samples/input.txt'
var defaultOutputFile = './samples/output-' + (Math.random() + 1).toString(36).substring(7) + '.txt'

function validOrientation(orientation) {
  return orientation === north || orientation === south || orientation === west || orientation === east
}

function initWorldDimensions(world, line) {
  var dimensions = line.trim().split(' ')

  if (dimensions.length != 2) {
    throw 'unexpected world dimensions\nexpected: 2\nactual: ' + dimensions.length
  }

  world.xLimit = parseInt(dimensions[0])
  world.yLimit = parseInt(dimensions[1])

  if (!Number.isInteger(world.xLimit) || !Number.isInteger(world.yLimit)) {
    throw 'world coordinates should be intergers'
  }

  if (world.xLimit > coordinateLimit || world.yLimit > coordinateLimit) {
    throw 'unexpected world dimensions; max allowed coordinate: 50'
  }

  world.grid = Array.from(Array(world.yLimit+1), () => new Array(world.xLimit+1))
}

function buildRobotWithPosition(line) {
  var pos = line.trim().split(' ')

  if (pos.length != 3) {
    throw 'unexpected robot coordinates size:\nexpected: int int str[S|N|W|E]\nactual: ' + line
  }

  var robot = {
    currentX: parseInt(pos[0]),
    currentY: parseInt(pos[1]),
    currentOrientation: pos[2]
  }

  if (!Number.isInteger(robot.currentX) || !Number.isInteger(robot.currentY) || !validOrientation(pos[2])) {
    throw 'unexpected robot coordinate types:\nexpected: int int str[S|N|W|E]\nactual: ' + line
  }

  return robot
}

async function main(inputFilePath, outputFilePath) {
  var inputFile = inputFilePath || defaultInputFile
  var outputFile = outputFilePath || defaultOutputFile
  console.log('writing output at: ' + outputFile)

  try {
    const fileStream = fs.createReadStream(inputFile)
    const lineReader = readline.createInterface({input: fileStream})
    
    var lineCount = -1
    var world = {}
    var currentRobot = {}
    var isFirstRobot = true
    
    for await (const line of lineReader) {
      lineCount++
      
      if (lineCount === worldDimensionsLine) {
        initWorldDimensions(world, line)     
        continue
      }

      if (lineCount === robotPositionLine) {
        currentRobot = buildRobotWithPosition(line)
        continue
      }

      if (lineCount === robotInstructionsLine) {
        processRobotInstructions(world, currentRobot, line, isFirstRobot, outputFile)
        isFirstRobot = false
        continue
      }

      lineCount = 0
    
    }

    fileStream.destroy()

  } catch (e) {
    console.log('ERROR: ', e)
  }
}

function turnRight(robot) {
  switch (robot.currentOrientation) {
    case north:
      robot.currentOrientation = east
      break
    case east:
      robot.currentOrientation = south
      break
    case south:
      robot.currentOrientation = west
      break
    case west:
      robot.currentOrientation = north
  }
}

function turnLeft(robot) {
  switch (robot.currentOrientation) {
    case north:
      robot.currentOrientation = west
      break
    case west:
      robot.currentOrientation = south
      break
    case south:
      robot.currentOrientation = east
      break
    case east:
      robot.currentOrientation = north
  }
}

function handleOffLimitMovement(world, robot) {
  if (world.grid[robot.currentY][robot.currentX] === scentedRef) {
    return
  }

  robot.status = lost
  world.grid[robot.currentY][robot.currentX] = scentedRef
}

function goNorth(world, robot) {
  var newY = robot.currentY + 1
  if (newY <= world.yLimit) {
    robot.currentY = newY
    return
  }
  
  handleOffLimitMovement(world, robot)
}

function goEast(world, robot) {
  var newX = robot.currentX + 1
  if (newX <= world.xLimit) {
    robot.currentX = newX
    return
  }
  
  handleOffLimitMovement(world, robot)
}

function goSouth(world, robot) {
  var newY = robot.currentY - 1
  if (newY >= 0) {
    robot.currentY = newY
    return
  }
  
  handleOffLimitMovement(world, robot)
}

function goWest(world, robot) {
  var newX = robot.currentX - 1
  if (newX >= 0) {
    robot.currentX = newX
    return
  }
  
  handleOffLimitMovement(world, robot)
}

function goForward(world, robot) {
  switch (robot.currentOrientation) {
    case north:
      goNorth(world, robot)
      break
    case east:
      goEast(world, robot)
      break
    case south:
      goSouth(world, robot)
      break
    case west:
      goWest(world, robot)
  }
}

function processInstruction(world, robot, instruction) {
  switch (instruction) {
    case right:
      turnRight(robot)
      break
    case left:
      turnLeft(robot)
      break
    case forward:
      goForward(world, robot)
      break
    // TODO: Support more instructions
    default:
      throw 'unsupported instruction: ' + instruction
  }
}

function processRobotInstructions(world, robot, instructions, isFirstRobot, outputFile) {
  if (instructions.length > instructionsLimit) {
    throw 'unexpected instructions size'
  }

  for (var i = 0; i < instructions.length; i++) {
    if (robot.status === lost) {
      break
    }

    processInstruction(world, robot, instructions.charAt(i))
  }

  writeOutput(robot, isFirstRobot, outputFile)
}

function writeOutput(robot, isFirstRobot, outputFile) {
  var out = ''

  if (!isFirstRobot) {
    out += '\n'
  }

  out += robot.currentX + ' ' + robot.currentY + ' ' + robot.currentOrientation

  if (robot.status === lost) {
    out += ' ' + lost
  }

  fs.writeFileSync(outputFile, out, { flag: 'a' })
}

if (require.main === module) {
  main()
}