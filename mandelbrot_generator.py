'''
File: MandelbrotGenerator.MandelBrotGenerator
Author: Matthew Olson
Created on Dec 20, 2014
Content: TODO
'''

def createGridBounds(xMin,xMax,yMin,yMax,pixelx,pixely,iterates,p=False):
    x = (xMin + xMax)/2
    y = (yMin + yMax)/2
    width = (xMax - xMin)
    height = (yMax - yMin)
    
    return createGrid(x,y,width,height,pixelx,pixely,iterates,p)

def createGrid(x,y,width,height,pixelx,pixely,iterates,printout=False):

    results = [[0 for i in range(pixely)] for j in range(pixelx)]

    for i in range(pixelx):
        for j in range(pixely):
            
            iX = x + (width/(pixelx-1))*i - width/2
            iY = y + (height/(pixely-1))*j - height/2
            
            vX = 0
            vY = 0
            vX2 = vX*vX
            vY2 = vY*vY
            if(printout):
                print("point"+str(iX) + " "+ str(iY))
            
            for n in range(iterates):
                if(vX2 + vY2 > 4):
                    results[i][j] = n
                    break
                vX = 2*vX*vY + iY
                vY = vY2 -vX2 + iX
                vX2 = vX*vX
                vY2 = vY*vY    
                
                if(printout):
                    print("value"+str(vX) + " "+ str(vY))
            
            if(results[i][j] == 0):
                results[i][j] = iterates
    return results


if __name__ == "__main__":
    x = 5
    y = 5
    data = createGridBounds(-2,2,-2,2,x,y,8,True)
    print(data)
