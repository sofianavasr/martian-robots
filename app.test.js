const { main, validOrientation, initWorldDimensions, buildRobotWithPosition, turnRight, turnLeft, goForward } = require('./app')
const fs = require('fs')
const { expect } = require('@jest/globals')

test('verifies the given orientation is valid (S|N|W|E)', () => {
  expect(validOrientation('S')).toBeTruthy
  expect(validOrientation('N')).toBeTruthy
  expect(validOrientation('W')).toBeTruthy
  expect(validOrientation('E')).toBeTruthy
  expect(validOrientation('U')).toBeFalsy
})

test('verifies the world dimensions are initialized', () => {
  var dummyWorld = {
    xLimit: undefined,
    yLimit: undefined
  }

  initWorldDimensions(dummyWorld, '2 4')

  expect(dummyWorld.xLimit).toEqual(2)
  expect(dummyWorld.yLimit).toEqual(4)
  expect(dummyWorld.grid.length).toEqual(5)
  expect(dummyWorld.grid[0].length).toEqual(3)
})

test('verifies the robot position is initialized', () => {
  var robot = buildRobotWithPosition('1 2 E ')

  expect(robot.currentX).toEqual(1)
  expect(robot.currentY).toEqual(2)
  expect(robot.currentOrientation).toEqual('E')
})

test('checks right turns', () => {
  var robot = {currentOrientation: 'N'}
  turnRight(robot)
  expect(robot.currentOrientation).toEqual('E')

  robot.currentOrientation = 'E'
  turnRight(robot)
  expect(robot.currentOrientation).toEqual('S')

  robot.currentOrientation = 'S'
  turnRight(robot)
  expect(robot.currentOrientation).toEqual('W')

  robot.currentOrientation = 'W'
  turnRight(robot)
  expect(robot.currentOrientation).toEqual('N')
})

test('checks left turns', () => {
  var robot = {currentOrientation: 'N'}
  turnLeft(robot)
  expect(robot.currentOrientation).toEqual('W')

  robot.currentOrientation = 'W'
  turnLeft(robot)
  expect(robot.currentOrientation).toEqual('S')

  robot.currentOrientation = 'S'
  turnLeft(robot)
  expect(robot.currentOrientation).toEqual('E')

  robot.currentOrientation = 'E'
  turnLeft(robot)
  expect(robot.currentOrientation).toEqual('N')
})

test('tests going forward', () => {
  var dummyWorld = {
    xLimit: undefined,
    yLimit: undefined
  }

  initWorldDimensions(dummyWorld, '2 4')

  var robot = {
    currentX: 0,
    currentY: 0,
    currentOrientation: 'N'
  }

  goForward(dummyWorld, robot)
  expect(robot.currentY).toEqual(1)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('N')

  goForward(dummyWorld, robot)
  expect(robot.currentY).toEqual(2)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('N')

  turnRight(robot)
  expect(robot.currentY).toEqual(2)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('E')

  goForward(dummyWorld, robot)
  expect(robot.currentY).toEqual(2)
  expect(robot.currentX).toEqual(1)
  expect(robot.currentOrientation).toEqual('E')
})

test('tests falling off mars', () => {
  var dummyWorld = {
    xLimit: undefined,
    yLimit: undefined
  }

  initWorldDimensions(dummyWorld, '2 4')

  var robot = {
    currentX: 0,
    currentY: 0,
    currentOrientation: 'N',
    status: undefined,
  }

  goForward(dummyWorld, robot)
  expect(robot.currentY).toEqual(1)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('N')
  expect(robot.status).toBeUndefined()

  turnLeft(robot)
  expect(robot.currentY).toEqual(1)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('W')
  expect(robot.status).toBeUndefined()

  goForward(dummyWorld, robot)
  expect(robot.currentY).toEqual(1)
  expect(robot.currentX).toEqual(0)
  expect(robot.currentOrientation).toEqual('W')
  expect(robot.status).toEqual('LOST')
  
  expect(dummyWorld.grid[robot.currentY][robot.currentX]).toEqual(-1) // scented cell

  // check robot 2 ignores instruction to fall off because of the scented cell
  var robot2 = {
    currentX: 0,
    currentY: 0,
    currentOrientation: 'N',
    status: undefined,
  }

  goForward(dummyWorld, robot2)
  expect(robot2.currentY).toEqual(1)
  expect(robot2.currentX).toEqual(0)
  expect(robot2.currentOrientation).toEqual('N')
  expect(robot2.status).toBeUndefined()

  turnLeft(robot2)
  expect(robot2.currentY).toEqual(1)
  expect(robot2.currentX).toEqual(0)
  expect(robot2.currentOrientation).toEqual('W')
  expect(robot2.status).toBeUndefined()

  // ignores goForward instruction to fall off
  goForward(dummyWorld, robot2)
  expect(robot2.currentY).toEqual(1)
  expect(robot2.currentX).toEqual(0)
  expect(robot2.currentOrientation).toEqual('W')
  expect(robot2.status).toBeUndefined()
})

test('runs program successfully', async () => {
  await main('./samples/input.txt', './samples/output_test.txt')

  fs.readFile('./samples/output_test.txt', 'utf8' , (err, data) => {
    expect(err).toBeNull()
    expect(data.replace(/\s/g, '')).toContain(`
    1 1 E 
    3 3 N LOST
    2 3 S`.replace(/\s/g, ''))
    })
})