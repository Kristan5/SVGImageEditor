/*
Name:           Kristan Samaroo
Student ID:     1045594
Email:          ksamaroo@uoguelph.ca

None of my code is based off of any other sources other than
Some parts of xmlExample.c provided, along with the findelement() function in LinkedListAPI.c

*/

#include "SVGParser.h"
#include "SVGParserHelper.h"

/** Function to create an SVG object based on the contents of an SVG file.
 *@pre File name cannot be an empty string or NULL.
       File represented by this name must exist and must be readable.
 *@post Either:
        A valid SVGimage has been created and its address was returned
		or 
		An error occurred, and NULL was returned
 *@return the pinter to the new struct or NULL
 *@param fileName - a string containing the name of the SVG file
**/
SVGimage* createSVGimage(char* fileName){
    int traversalValid = 0;
    if (fileName == NULL){
        return NULL;
    }
    FILE * testValid;
    testValid = fopen(fileName, "r");

    if (testValid == NULL){
        return NULL;
    }
    fclose(testValid);
    SVGimage *theSVGimage = NULL;

    xmlNode *root_element = NULL;

    /*Get the root element node */
    xmlDoc * doc = parseTree(fileName);
    if (doc == NULL){
        return NULL;
    }

    root_element = xmlDocGetRootElement(doc);
    
    if (strcmp((char*)root_element->name, "svg") == 0) {
        theSVGimage = malloc(sizeof(SVGimage));
        initializeAllLists(theSVGimage, 1);
        traversalValid = traverseSVGTree(root_element, theSVGimage, root_element);
        // If there is an error while traversing the svg tree free 
        if (traversalValid == -1){
            // there is an error
            printf("error\n");
        }
        //printf("To String After SUCCESS: %s\n", toString(theSVGimage->rectangles));
    }
    /*free the document */
    xmlFreeDoc(doc);

    /*
     *Free the global variables that may
     *have been allocated by the parser.
     */
    xmlCleanupParser();

    return theSVGimage;
}

/** Function to create a string representation of an SVG object.
 *@pre SVGimgage exists, is not null, and is valid
 *@post SVGimgage has not been modified in any way, and a string representing the SVG contents has been created
 *@return a string contaning a humanly readable representation of an SVG object
 *@param obj - a pointer to an SVG struct
**/
char* SVGimageToString(SVGimage* img) {
	if (img == NULL){
        return NULL;
	}

    char * circles = toString(img->circles);
    char * rectangles = toString(img->rectangles);
    char * paths = toString(img->paths);
    char * groups = toString(img->groups);
    char * otherAttributes = toString(img->otherAttributes);
    char * SVGDescription = NULL;
    SVGDescription = malloc(sizeof(char)*(strlen(img->namespace) + strlen(img->title) + strlen(img->description) + strlen(circles) + strlen(rectangles) + strlen(paths) + strlen(groups) + strlen(otherAttributes))+ 100);

    strcpy(SVGDescription, img->namespace);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, img->title);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, img->description);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, circles);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, rectangles);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, paths);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, groups);
    strcat(SVGDescription, "\n");
    strcat(SVGDescription, otherAttributes);
    
    free(circles);
    free(rectangles);
    free(paths);
    free(groups);
    free(otherAttributes);
    return SVGDescription;
}

/** Function to delete image content and free all the memory.
 *@pre SVGimgage  exists, is not null, and has not been freed
 *@post SVSVGimgageG  had been freed
 *@return none
 *@param obj - a pointer to an SVG struct
**/
void deleteSVGimage(SVGimage* img) {
    if (img == NULL){
        return;
    }
    freeList(img->rectangles);
    freeList(img->circles);
    freeList(img->paths);
    freeList(img->groups);
    freeList(img->otherAttributes);
    free(img);
}

/* For the four "get..." functions below, make sure you return a list of opinters to the existing structs 
 - do not allocate new structs.  They all share the same format, and only differ in the contents of the lists 
 they return.
 
 *@pre SVGimgage exists, is not null, and has not been freed
 *@post SVGimgage has not been modified in any way
 *@return a newly allocated List of components.  While the List struct itself is new, the components in it are just pointers
  to the ones in the image.

 The list must me empty if the element is not found - do not return NULL

 *@param obj - a pointer to an SVG struct
 */

// Function that returns a list of all rectangles in the image.  
List* getRects(SVGimage* img){
    if (img == NULL){
        return NULL;
    }
    List * rectangleList = initializeList(&rectangleToString, &deleteRectangle, &compareRectangles);
    getAllOfType("Rectangle", rectangleList, img, "SVG");
    return rectangleList;
}
// Function that returns a list of all circles in the image.  
List* getCircles(SVGimage* img){
    if (img == NULL){
        return NULL;
    }
    List * circleList = initializeList(&circleToString, &deleteCircle, &compareCircles);
    getAllOfType("Circle", circleList, img, "SVG");
    return circleList;
}
// Function that returns a list of all groups in the image.  
List* getGroups(SVGimage* img){
    if (img == NULL){
        return NULL;
    }
    List * groupList = initializeList(&groupToString, &deleteGroup, &compareGroups);
    getAllOfType("Group", groupList, img, "SVG");
    return groupList;
}
// Function that returns a list of all paths in the image.  
List* getPaths(SVGimage* img){
    if (img == NULL){
        return NULL;
    }
    List * pathList = initializeList(&pathToString, &deletePath, &comparePaths);
    getAllOfType("Path", pathList, img, "SVG");
    return pathList;
}

/* For the four "num..." functions below, you need to search the SVG image for components  that match the search 
  criterion.  You may wish to write some sort of a generic searcher fucntion that accepts an image, a predicate function,
  and a dummy search record as arguments.  We will discuss such search functions in class

 NOTE: For consistency, use the ceil() function to round the floats up to the nearest integer once you have computed 
 the number you need.  See A1 Module 2 for details.

 *@pre SVGimgage exists, is not null, and has not been freed.  The search criterion is valid
 *@post SVGimgage has not been modified in any way
 *@return an int indicating how many objects matching the criterion are contained in the image
 *@param obj - a pointer to an SVG struct
 *@param 2nd - the second param depends on the function.  See details below
 */   

// Function that returns the number of all rectangles with the specified area
int numRectsWithArea(SVGimage* img, float area) {
    if (img == NULL || area < 0){
        return 0;
    }
    // USE GETRECTS FUNCTION SO THAT CHECK ALL OF THE RECTANGLES IN THE SVGIMAGE AND THE GROUPS FOR AREA
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "rectangle");
    void * ptr = &area;

    List * rectList = getRects(img);
    int numRects = getNumWithArea(rectList, type, ptr);
    clearListRevised(rectList);
    free(rectList);
    return numRects;
}

// Function that returns the number of all circles with the specified area
int numCirclesWithArea(SVGimage* img, float area) {
    if (img == NULL || area < 0){
        return 0;
    }
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "circle");
    void * ptr = &area;
    
    List * circleList = getCircles(img);
    int numCircles = getNumWithArea(circleList, type, ptr);
    clearListRevised(circleList);
    free(circleList);
    return numCircles;
}
// Function that returns the number of all paths with the specified data - i.e. Path.data field
int numPathsWithdata(SVGimage* img, char* data) {
    if (img == NULL || data == NULL){
        return 0;
    }
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "path");
    void * ptr = data;

    List * pathList = getPaths(img);
    int numPaths = getNumWithArea(pathList, type, ptr);
    clearListRevised(pathList);
    free(pathList);
    return numPaths;
}
// Function that returns the number of all groups with the specified length - see A1 Module 2 for details
int numGroupsWithLen(SVGimage* img, int len) {
    if (img == NULL|| len < 0){
        return 0;
    }
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "group");
    void * ptr = &len;

    List * groupList = getGroups(img);
    int numGroups = getNumWithArea(groupList, type, ptr);
    clearListRevised(groupList);
    free(groupList);
    return numGroups;
}

/*  Function that returns the total number of Attribute structs in the SVGimage - i.e. the number of Attributes
    contained in all otherAttributes lists in the structs making up the SVGimage
    *@pre SVGimgage  exists, is not null, and has not been freed.  
    *@post SVGimage has not been modified in any way
    *@return the total length of all attribute structs in the SVGimage
    *@param obj - a pointer to an SVG struct
*/
int numAttr(SVGimage* img){
    if (img == NULL){
        return 0;
    }

    List * attributeList = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
    List * rectList = getRects(img);
    List * circleList = getCircles(img);
    List * pathList = getPaths(img);
    getAllOfType("Attribute", attributeList, img, "SVG");

    int rectAttributeCount = getOtherAttributesCount("Rectangle", rectList);
    int circleAttributeCount = getOtherAttributesCount("Circle", circleList);
    int pathAttributeCount = getOtherAttributesCount("Path", pathList);
    // This counts the attributes in both the svg and all of the groups 
    int otherAttributeCount = getLength(attributeList);
    int count = rectAttributeCount + circleAttributeCount + pathAttributeCount + otherAttributeCount;

    clearListRevised(rectList);
    free(rectList);
    clearListRevised(pathList);
    free(pathList);
    clearListRevised(circleList);
    free(circleList);
    clearListRevised(attributeList);
    free(attributeList);

    return count;
}

bool validateSVGimage(SVGimage* image, char* schemaFile) {
    // Checking if parameters are valid
    if (image == NULL || strcmp(schemaFile, "") == 0){
        return false;
    }
    FILE * fp = fopen(schemaFile, "r");
    if (fp == NULL){
        return false;
    }
    fclose(fp);

	xmlDocPtr doc;
	xmlSchemaPtr schema = NULL;
	xmlSchemaParserCtxtPtr ctxt;

    xmlLineNumbersDefault(1);

    ctxt = xmlSchemaNewParserCtxt(schemaFile);

    xmlSchemaSetParserErrors(ctxt, (xmlSchemaValidityErrorFunc) fprintf, (xmlSchemaValidityWarningFunc) fprintf, stderr);
    schema = xmlSchemaParse(ctxt);
    xmlSchemaFreeParserCtxt(ctxt);

    doc = createDoc(image);

	if (doc == NULL){
        freeSchema(schema);
        return false;
	}
	else{
		xmlSchemaValidCtxtPtr ctxt;
		int ret;

		ctxt = xmlSchemaNewValidCtxt(schema);

		xmlSchemaSetValidErrors(ctxt, (xmlSchemaValidityErrorFunc) fprintf, (xmlSchemaValidityWarningFunc) fprintf, stderr);
		
        ret = xmlSchemaValidateDoc(ctxt, doc);

		if (ret == 0){
            xmlSchemaFreeValidCtxt(ctxt);
            xmlFreeDoc(doc);
            freeSchema(schema);
            return true;
		}
		else if (ret > 0){
            xmlSchemaFreeValidCtxt(ctxt);
            xmlFreeDoc(doc);
            freeSchema(schema);
            return false;
		}
		else {
            freeSchema(schema);
            return false;
		}
	}
    return false;
}

SVGimage* createValidSVGimage(char* fileName, char* schemaFile) {
    SVGimage * tmpSVG = createSVGimage(fileName);
    if (tmpSVG == NULL){
        return NULL;
    }
    if (validateSVGimage(tmpSVG, schemaFile) == true){
        return tmpSVG;
    }
    else {
        if (tmpSVG != NULL){
            deleteSVGimage(tmpSVG);
        }
        return NULL;
    }
    return NULL;
}

bool writeSVGimage(SVGimage* image, char* fileName) {
    if (image == NULL || strcmp(fileName, "") == 0){
        return false;
    }

    xmlDocPtr doc = createDoc(image);

    /* Dumping document to stdio or file  */
    xmlSaveFormatFileEnc(fileName, doc, "UTF-8", 1);

    /*free the document */
    xmlFreeDoc(doc);

    xmlCleanupParser();

    return true;
}

void setAttribute(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute){
    if (validAttribute(newAttribute) == 1){
        return;
    }
    if (image == NULL || (elemIndex < 0 && elemType != SVG_IMAGE)){
        deleteAttribute(newAttribute);
        return;
    }
    if (elemType != SVG_IMAGE && elemType != CIRC && elemType != RECT && elemType != PATH && elemType != GROUP){
        deleteAttribute(newAttribute);
        return;
    }

    if (elemType == SVG_IMAGE){
        setOtherAttributes(newAttribute, image->otherAttributes);
    }
    else if (elemType == CIRC){
        setAttributeForCircle(image, elemType, elemIndex, newAttribute);
    }
    else if (elemType == RECT){
        setAttributeForRectangle(image, elemType, elemIndex, newAttribute);
    }
    else if (elemType == PATH){
        setAttributeForPath(image, elemType, elemIndex, newAttribute);
    }
    else if (elemType == GROUP){
        setAttributeForGroup(image, elemType, elemIndex, newAttribute);
    }
}

void addComponent(SVGimage* image, elementType type, void* newElement){
    // IN THIS FUNCTION I WANT TO BE ABLE TO CHECK IF THE UNITS HAVE BEEN INTIALIZED BUT I DO NOT KNOW HOW TO AT THE MOMENT
    if (image == NULL || newElement == NULL || type == SVG_IMAGE || type == GROUP){
        return;
    }
    if (type == CIRC){
        Circle * tmpCircle = (Circle*)newElement;
        if(tmpCircle->otherAttributes == NULL){
            tmpCircle->otherAttributes = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
        }
        insertBack(image->circles, tmpCircle);
    }
    else if (type == RECT){
        Rectangle * tmpRect = (Rectangle*)newElement;
        if(tmpRect->otherAttributes == NULL){
            tmpRect->otherAttributes = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
        }
        insertBack(image->rectangles, tmpRect);
    }
    else if (type == PATH){
        Path * tmpPath  = (Path*)newElement;
        if(tmpPath->otherAttributes == NULL){
            tmpPath->otherAttributes = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
        }
        if (tmpPath->data == NULL){
            tmpPath->data = malloc(sizeof(char)*10);
            strcpy(tmpPath->data, "");
        }
        insertBack(image->paths, tmpPath);
    }
}

char* attrToJSON(const Attribute *a){
    if (a == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    // Includes buffer for special characters in json string
    int len = strlen(a->name) + strlen(a->value) + 30;
    char * jsonStr = malloc(sizeof(char)*len);
    sprintf(jsonStr, "{\"name\":\"%s\",\"value\":\"%s\"}", a->name, a->value);
    return jsonStr;
}
char* circleToJSON(const Circle *c){
    if (c == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    char * cx = floatToString(c->cx);
    char * cy = floatToString(c->cy);
    char * r = floatToString(c->r);    
    int len = strlen(cx) + strlen(cy) + strlen(r) + 256;
    free(cx);
    free(cy);
    free(r);
    char * jsonStr = malloc(sizeof(char)*len);
    sprintf(jsonStr, "{\"cx\":%.2f,\"cy\":%.2f,\"r\":%.2f,\"numAttr\":%d,\"units\":\"%s\"}", c->cx, c->cy, c->r, getLength(c->otherAttributes), c->units);
    return jsonStr;
}
char* rectToJSON(const Rectangle *r){
    if (r == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    char * x = floatToString(r->x);
    char * y = floatToString(r->y);
    char * width = floatToString(r->width);    
    char * height = floatToString(r->height);    
    int len = strlen(x) + strlen(y) + strlen(width) + strlen(height) + 256;
    free(x);
    free(y);
    free(width);
    free(height);
    char * jsonStr = malloc(sizeof(char)*len);
    sprintf(jsonStr, "{\"x\":%.2f,\"y\":%.2f,\"w\":%.2f,\"h\":%.2f,\"numAttr\":%d,\"units\":\"%s\"}", r->x, r->y, r->width, r->height, getLength(r->otherAttributes), r->units);
    return jsonStr;
}
char* pathToJSON(const Path *p){
    if (p == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    int len = strlen(p->data) + 100;
    char * jsonStr = malloc(sizeof(char)*len);
    // Limiting path data to 64 chars
    char pathData[1000] = "";
    strncpy(pathData, p->data, 64);
    sprintf(jsonStr, "{\"d\":\"%s\",\"numAttr\":%d}", pathData, getLength(p->otherAttributes));
    return jsonStr;
}
char* groupToJSON(const Group *g){
    if (g == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    int len = 100;
    char * jsonStr = malloc(sizeof(char)*len);
    int childrenLen =  getLength(g->circles) + getLength(g->rectangles) + getLength(g->paths) + getLength(g->groups);
    sprintf(jsonStr, "{\"children\":%d,\"numAttr\":%d}", childrenLen, getLength(g->otherAttributes));
    return jsonStr;
}

char* attrListToJSON(const List *list){
    if (list == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "[]");
        return isNull;
    }
    List * tmpList = (List*)list;
    char * tmpStr;
    char * jsonStr;
    int len = 0;
    // length is jumper of elements in list multipled by the length of a json string (100)
    len = (getLength(tmpList)+1) * 100;
    jsonStr = malloc(sizeof(char)*len);
    strcpy(jsonStr, "[");
    ListIterator itr = createIterator(tmpList);
	Attribute* data = nextElement(&itr);
	while (data != NULL) {
        tmpStr = attrToJSON(data);
        strcat(jsonStr, tmpStr);
		data = nextElement(&itr);
        if (data != NULL){
            strcat(jsonStr, ","); 
        }
        free(tmpStr);
	}
    strcat(jsonStr, "]");
    return jsonStr;
}
char* circListToJSON(const List *list){
    if (list == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "[]");
        return isNull;
    }
    List * tmpList = (List*)list;
    char * tmpStr;
    char * jsonStr;
    int len = 0;
    // length is jumper of elements in list multipled by the length of a json string (100)
    len = (getLength(tmpList)+1) * 100;
    jsonStr = malloc(sizeof(char)*len);
    strcpy(jsonStr, "[");
    ListIterator itr = createIterator(tmpList);
	Circle* data = nextElement(&itr);
	while (data != NULL) {
        tmpStr = circleToJSON(data);
        strcat(jsonStr, tmpStr);
		data = nextElement(&itr);
        if (data != NULL){
            strcat(jsonStr, ","); 
        }
        free(tmpStr);
	}
    strcat(jsonStr, "]");
    return jsonStr;
}
char* rectListToJSON(const List *list){
    if (list == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "[]");
        return isNull;
    }
    List * tmpList = (List*)list;
    char * tmpStr;
    char * jsonStr;
    int len = 0;
    // length is jumper of elements in list multipled by the length of a json string (100)
    len = (getLength(tmpList)+1) * 100;
    jsonStr = malloc(sizeof(char)*len);
    strcpy(jsonStr, "[");
    ListIterator itr = createIterator(tmpList);
	Rectangle* data = nextElement(&itr);
	while (data != NULL) {
        tmpStr = rectToJSON(data);
        strcat(jsonStr, tmpStr);
		data = nextElement(&itr);
        if (data != NULL){
            strcat(jsonStr, ","); 
        }
        free(tmpStr);
	}
    strcat(jsonStr, "]");
    return jsonStr;
}
char* pathListToJSON(const List *list){
    if (list == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "[]");
        return isNull;
    }
    List * tmpList = (List*)list;
    char * tmpStr;
    char * jsonStr;
    int len = 0;
    // length is jumper of elements in list multipled by the length of a json string (100)
    len = (getLength(tmpList)+1) * 100;
    jsonStr = malloc(sizeof(char)*len);
    strcpy(jsonStr, "[");
    ListIterator itr = createIterator(tmpList);
	Path* data = nextElement(&itr);
	while (data != NULL) {
        len += strlen(data->data) + 10;
        jsonStr = realloc(jsonStr, len);

        tmpStr = pathToJSON(data);
        strcat(jsonStr, tmpStr);
		data = nextElement(&itr);
        if (data != NULL){
            strcat(jsonStr, ","); 
        }
        free(tmpStr);
	}
    strcat(jsonStr, "]");
    return jsonStr;
}
char* groupListToJSON(const List *list){
    if (list == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "[]");
        return isNull;
    }
    List * tmpList = (List*)list;
    char * tmpStr;
    char * jsonStr;
    int len = 0;
    // length is jumper of elements in list multipled by the length of a json string (100)
    len = (getLength(tmpList)+1) * 100;
    jsonStr = malloc(sizeof(char)*len);
    strcpy(jsonStr, "[");
    ListIterator itr = createIterator(tmpList);
	Group* data = nextElement(&itr);
	while (data != NULL) {
        tmpStr = groupToJSON(data);
        strcat(jsonStr, tmpStr);
		data = nextElement(&itr);
        if (data != NULL){
            strcat(jsonStr, ","); 
        }
        free(tmpStr);
	}
    strcat(jsonStr, "]");
    return jsonStr;
}

char* SVGtoJSON(const SVGimage* imge){
    if (imge == NULL){
        char * isNull = malloc(sizeof(char)*5);
        strcpy(isNull, "{}");
        return isNull;
    }
    SVGimage * tmpSVG = (SVGimage*)imge;
    char * tmpStr;
    tmpStr = malloc(sizeof(char)*100);
    
    List * rectangles = getRects(tmpSVG);
    List * circles = getCircles(tmpSVG);
    List * paths = getPaths(tmpSVG);
    List * groups = getGroups(tmpSVG);
    sprintf(tmpStr,"{\"numRect\":%d,\"numCirc\":%d,\"numPaths\":%d,\"numGroups\":%d}", getLength(rectangles), getLength(circles), getLength(paths), getLength(groups));
    clearListRevised(rectangles);
    clearListRevised(circles);
    clearListRevised(paths);
    clearListRevised(groups);
    free(rectangles);
    free(circles);
    free(paths);
    free(groups);
    
    return tmpStr;
}

/*****************************************************************************************************************/
SVGimage* JSONtoSVG(const char* svgString){
    return NULL;
}
Rectangle* JSONtoRect(const char* svgString){
    return NULL;
}
Circle* JSONtoCircle(const char* svgString){
    return NULL;
}

/*****************************************************************************************************************/

// NEED TO TEST ALL THESE FUNCTIONS THROUGHLY AND FOR MEMORY LEAKS

// FOR EACH OF THESE FUNCTIONS IT WILL CREATE ONLY A VALID SVG IMAGE
// IF THE SVG IMAGE IS INVALID, THEN IT WILL RETURN A SPECIAL STRING 
// THAT WILL TELL JAVASCRIPT THAT THE GIVEN FILE IS NOT VALID
char * SVGFileToJson(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * tmpStr = SVGtoJSON(tmpSVG);
    deleteSVGimage(tmpSVG);
    return tmpStr;
}

char * getSVGFileTitle(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * tmpStr = malloc(sizeof(char)*(strlen(tmpSVG->title)+100));
    strcpy(tmpStr, tmpSVG->title);
    deleteSVGimage(tmpSVG);
    return tmpStr;
}
char * getSVGFileDescription(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * tmpStr = malloc(sizeof(char)*(strlen(tmpSVG->description)+100));
    strcpy(tmpStr, tmpSVG->description);
    deleteSVGimage(tmpSVG);
    return tmpStr;
}

char * getSVGFileRectList(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * rectList = rectListToJSON(tmpSVG->rectangles);
    deleteSVGimage(tmpSVG);
    return rectList;
}
char * getSVGFilePathList(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * pathList = pathListToJSON(tmpSVG->paths);
    deleteSVGimage(tmpSVG);
    return pathList;
}
char * getSVGFileCircleList(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * circleList = circListToJSON(tmpSVG->circles);
    deleteSVGimage(tmpSVG);
    return circleList;
}
char * getSVGFileGroupList(char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    char * groupList = groupListToJSON(tmpSVG->groups);
    deleteSVGimage(tmpSVG);
    return groupList;
}

char * getAttrList(char * shape, char * index, char * filename, char * schema){
    SVGimage * tmpSVG = createSVGimage(filename);
    char * attrList;
    if (tmpSVG == NULL){
        char * invalid = malloc(sizeof(char)*64);
        strcpy(invalid, "invalid");
        return invalid;
    }
    int count = 0;
    int indexNum = atoi(index);
    if (strcmp(shape, "Circle") == 0){
        ListIterator itr = createIterator(tmpSVG->circles);
        Circle* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                attrList = attrListToJSON(data->otherAttributes);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Path") == 0){
        ListIterator itr = createIterator(tmpSVG->paths);
        Path* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                attrList = attrListToJSON(data->otherAttributes);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Rectangle") == 0){
        ListIterator itr = createIterator(tmpSVG->rectangles);
        Rectangle* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                attrList = attrListToJSON(data->otherAttributes);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Group") == 0){
        ListIterator itr = createIterator(tmpSVG->groups);
        Group* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                attrList = attrListToJSON(data->otherAttributes);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else {
        attrList = malloc(sizeof(char)*64);
        strcpy(attrList, "wrongShape");
    }

    deleteSVGimage(tmpSVG);
    return attrList;
}

char * setTitle(char * newTitle, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }
    strncpy(tmpSVG->title, newTitle, 255);
    // NEED TO TEST THIS
    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

char * setDescription(char * newDescription, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }
    strncpy(tmpSVG->description, newDescription, 255);
    // NEED TO TEST THIS
    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

char * updateAttribute(char * shape, char * index, char * attributeName, char * newValue, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }
    // Making a copy of the javascript provided attribute name and value
    char * tmpAttributeName = malloc(sizeof(char)*strlen(attributeName) + 1000);
    char * tmpNewValue = malloc(sizeof(char)*strlen(newValue) + 1000);
    strcpy(tmpAttributeName, attributeName);
    strcpy(tmpNewValue, newValue);
    // char * tmpAttributeName = attributeName;
    // char * tmpNewValue =newValue;

    // printf("ATTRIBUTE NAME IS: '%s': %ld || '%s': %ld\n", tmpAttributeName, strlen(tmpAttributeName), attributeName, strlen(attributeName));

    int count = 0;
    int indexNum = atoi(index);
    if (strcmp(shape, "Circle") == 0){
        ListIterator itr = createIterator(tmpSVG->circles);
        Circle* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                Attribute * newAttribute = createAttribute(tmpAttributeName, tmpNewValue);
                setAttribute(tmpSVG, CIRC, indexNum, newAttribute);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Path") == 0){
        ListIterator itr = createIterator(tmpSVG->paths);
        Path* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                // attrList = attrListToJSON(data->otherAttributes);
                Attribute * newAttribute = createAttribute(tmpAttributeName, tmpNewValue);
                setAttribute(tmpSVG, PATH, indexNum, newAttribute);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Rectangle") == 0){
        ListIterator itr = createIterator(tmpSVG->rectangles);
        Rectangle* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                // attrList = attrListToJSON(data->otherAttributes);
                Attribute * newAttribute = createAttribute(tmpAttributeName, tmpNewValue);
                setAttribute(tmpSVG, RECT, indexNum, newAttribute);
            }
            data = nextElement(&itr);
            count ++;
        }
    }
    else if (strcmp(shape, "Group") == 0){
        ListIterator itr = createIterator(tmpSVG->groups);
        Group* data = nextElement(&itr);
        while (data != NULL) {
            if (count == indexNum){
                // attrList = attrListToJSON(data->otherAttributes);/
                Attribute * newAttribute = createAttribute(tmpAttributeName, tmpNewValue);
                setAttribute(tmpSVG, GROUP, indexNum, newAttribute);
            }
            data = nextElement(&itr);
            count ++;
        }
    }

    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    // free(tmpAttributeName);
    // free(tmpNewValue);
    return toReturn;
}

char * createNewSVGFile(char * filename, char * title, char * description){
    char * toReturn = malloc(sizeof(char)*64);
    SVGimage * tmpSVG = malloc(sizeof(SVGimage));
    initializeAllLists(tmpSVG, 1);
    strcpy(tmpSVG->namespace, "http://www.w3.org/2000/svg");
    strcpy(tmpSVG->title, title);
    strcpy(tmpSVG->description, description);
    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "successfully created");
    }
    else {
        strcpy(toReturn, "creation failed");
    }
    return toReturn;
}

char * createCircle(char * cx, char * cy, char * r, char * units, char * fill, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }

    char fillName[256] = "fill";

    Circle * tmpCircle = malloc(sizeof(Circle));
    tmpCircle->cx = atof(cx);
    tmpCircle->cy = atof(cy);
    tmpCircle->r = atof(r);
    strcpy(tmpCircle->units,units);
    tmpCircle->otherAttributes = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);

    Attribute * tmpAttribute = malloc(sizeof(Attribute));

    char * tmpAttributeName = malloc(sizeof(char)*strlen(fillName) + 1000);
    char * tmpNewValue = malloc(sizeof(char)*strlen(fill) + 1000);
    strncpy(tmpAttributeName, fillName, strlen(fillName));
    strncpy(tmpNewValue, fill, strlen(fill));
    tmpAttribute->name = tmpAttributeName;
    tmpAttribute->value = tmpNewValue;

    insertBack(tmpCircle->otherAttributes, tmpAttribute);

    insertBack(tmpSVG->circles, tmpCircle);

    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

char * createRectangle(char * x, char * y, char * w, char * h, char * units, char * fill, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }

    char fillName[256] = "fill";

    Rectangle * tmpRect = malloc(sizeof(Rectangle));
    tmpRect->x = atof(x);
    tmpRect->y = atof(y);
    tmpRect->width = atof(w);
    tmpRect->height = atof(h);
    strcpy(tmpRect->units,"");
    tmpRect->otherAttributes = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);

    Attribute * tmpAttribute = malloc(sizeof(Attribute));

    char * tmpAttributeName = malloc(sizeof(char)*strlen(fillName) + 1000);
    char * tmpNewValue = malloc(sizeof(char)*strlen(fill) + 1000);
    strncpy(tmpAttributeName, fillName, strlen(fillName));
    strncpy(tmpNewValue, fill, strlen(fill));
    tmpAttribute->name = tmpAttributeName;
    tmpAttribute->value = tmpNewValue;

    insertBack(tmpRect->otherAttributes, tmpAttribute);

    insertBack(tmpSVG->rectangles, tmpRect);

    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

char * scaleCircles(char * factor, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }

    float factorNum = atof(factor);
    // Iterate through each circle in the image and multiply 'r' by factor 
    ListIterator itr = createIterator(tmpSVG->circles);
	Circle* data = nextElement(&itr);
	while (data != NULL) {
        data->r = data->r * factorNum;
		data = nextElement(&itr);
	}

    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

char * scaleRectangles(char * factor, char * filename, char * schema){
    SVGimage * tmpSVG = createValidSVGimage(filename, schema);
    char * toReturn = malloc(sizeof(char)*64);
    if (tmpSVG == NULL){
        strcpy(toReturn, "invalid");
        return toReturn;
    }
    float factorNum = atof(factor);
    // Iterate through each rectangle in the image and multiply 'width' and 'height' by factor 
    ListIterator itr = createIterator(tmpSVG->rectangles);
	Rectangle* data = nextElement(&itr);
	while (data != NULL) {
        data->width = data->width * factorNum;
        data->height = data->height * factorNum;
		data = nextElement(&itr);
	}

    bool status = writeSVGimage(tmpSVG, filename);
    if (status == true){
        strcpy(toReturn, "success");
    }
    else {
        strcpy(toReturn, "failed");
    }
    deleteSVGimage(tmpSVG);
    return toReturn;
}

/* ************************************ Assignment 2 Helper Functions******************************************** */
// Returns 0 if valid and 1 if not valid 
int validAttribute(Attribute* newAttribute){
    int valid = 0;
    if (newAttribute == NULL){
        valid = 1;
    }
    else if (newAttribute->name == NULL && newAttribute->value == NULL){
        free(newAttribute);
        valid = 1;
    }
    else if (newAttribute->name != NULL && newAttribute->value == NULL){
        free(newAttribute->name);
        free(newAttribute);
        valid = 1;
    }
    else if (newAttribute->name == NULL && newAttribute->value != NULL){
        free(newAttribute->value);
        free(newAttribute);
        valid = 1;
    }
    // Can an svg image have an empty name and/ or an empty value? 
    return valid;
}

void setAttributeForCircle(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute){
	// NEED TO FIX THIS 
    if (elemIndex >= getLength(image->circles)){
        return;
    }
    ListIterator itr = createIterator(image->circles);
    int count = 0;
	Circle* data = nextElement(&itr);
	while (data != NULL) {
        if (count == elemIndex){
            if (newAttribute->value == NULL){
                return;
            }
            if (strcmp(newAttribute->name, "cx") == 0 && toFloat(newAttribute->value) >= 0){
                data->cx = toFloat(newAttribute->value);
            }
            else if (strcmp(newAttribute->name, "cy") == 0 && toFloat(newAttribute->value) >= 0){
                data->cy = toFloat(newAttribute->value);
            }
            else if (strcmp(newAttribute->name, "r") == 0 && toFloat(newAttribute->value) >= 0){
                data->r = toFloat(newAttribute->value);
            }
            else {
                //Check other attributes for attribute to add
                setOtherAttributes(newAttribute, data->otherAttributes);
            }
        }
		data = nextElement(&itr);
        count ++;
	}
}

void setAttributeForRectangle(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute){
    if (elemIndex >= getLength(image->rectangles)){
        return;
    }
    ListIterator itr = createIterator(image->rectangles);
    int count = 0;
	Rectangle* data = nextElement(&itr);
	while (data != NULL) {
        if (count == elemIndex){
            if (newAttribute->value == NULL){
                return;
            }
            if (strcmp(newAttribute->name, "x") == 0 && toFloat(newAttribute->value) >= 0){
                data->x = toFloat(newAttribute->value);
            }
            else if (strcmp(newAttribute->name, "y") == 0 && toFloat(newAttribute->value) >= 0){
                data->y = toFloat(newAttribute->value);
            }
            else if (strcmp(newAttribute->name, "width") == 0 && toFloat(newAttribute->value) >= 0){
                data->width = toFloat(newAttribute->value);
            }
            else if (strcmp(newAttribute->name, "height") == 0 && toFloat(newAttribute->value) >= 0){
                data->height = toFloat(newAttribute->value);
            }
            else {
                //Check other attributes for attribute to add
                setOtherAttributes(newAttribute, data->otherAttributes);
            }
        }
		data = nextElement(&itr);
        count ++;
	}
}

void setAttributeForPath(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute){
    if (elemIndex >= getLength(image->paths)){
        return;
    }
    ListIterator itr = createIterator(image->paths);
    int count = 0;
	Path* data = nextElement(&itr);
	while (data != NULL) {
        if (count == elemIndex){
            if (newAttribute->value == NULL){
                return;
            }
            if (strcmp(newAttribute->name, "d") == 0){
                // CHECK IF THIS IS THE RIGHT WAY TO DO THIS FIRST, THIS MIGHT BE TROUBLESOME
                free(data->data);
                data->data = newAttribute->value;
                free(newAttribute->name);
                free(newAttribute);
            }
            else {
                //Check other attributes for attribute to add
                // THIS MIGHT HAVE TO BE IN AN ELSE OUTSIDE OF THE FIRST IF
                // SHOULD MAKE THIS ELSE IF SO THAT IF NEW ATTRIBUTE
                setOtherAttributes(newAttribute, data->otherAttributes);
            }
        }
		data = nextElement(&itr);
        count ++;
	}
}

void setAttributeForGroup(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute){
    char * test = NULL;
    char * alp = NULL;
    strcat(test, alp);
    if (elemIndex >= getLength(image->groups)){
        return;
    }
    ListIterator itr = createIterator(image->groups);
    int count = 0;
	Group* data = nextElement(&itr);
	while (data != NULL) {
        if (count == elemIndex){
            setOtherAttributes(newAttribute, data->otherAttributes);
        }
		data = nextElement(&itr);
        count ++;
	}
}

void setOtherAttributes(Attribute* newAttribute, List * otherAttributesList){
    ListIterator itr = createIterator(otherAttributesList);
	Attribute* data = nextElement(&itr);
	while (data != NULL) {
        if (strcmp(newAttribute->name, data->name) == 0){
            free(data->value);
            data->value = newAttribute->value;
            free(newAttribute->name);
            free(newAttribute);
            return;
        }
		data = nextElement(&itr);
	}
    // If iterates through loop without finding the correct pre-existing attribute name, 
    // then just add the new attribute to the list of other attributes 
    insertBack(otherAttributesList, newAttribute);
}

void freeSchema(xmlSchemaPtr schema){
	// free the resource
    if(schema != NULL)
    	xmlSchemaFree(schema);

    xmlSchemaCleanupTypes();
    xmlCleanupParser();
    xmlMemoryDump();
}

xmlDocPtr createDoc(SVGimage * image){
    xmlDocPtr doc = NULL;
    xmlNodePtr root_node = NULL;

    LIBXML_TEST_VERSION;

    /* 
     * Creates a new document, a node and set it as a root node
     */
    doc = xmlNewDoc(BAD_CAST "1.0");
    root_node = xmlNewNode(NULL, BAD_CAST "svg");
    xmlDocSetRootElement(doc, root_node);

    char * parentType = malloc(sizeof(char)*10);
    strcpy(parentType, "SVG");

    addNameSpace(root_node, image);
    addTitle(root_node, image);
    addDescription(root_node, image);

    if ( addCircles(image, root_node, parentType) == 1 || addRectangles(image, root_node, parentType) == 1 || addPaths(image, root_node, parentType) == 1 || addGroups(image, root_node, parentType) == 1) {
        free(parentType);
        return NULL;
    }
    if (addOtherAttributes(root_node, image->otherAttributes, parentType) == 1){
        free(parentType);
        return NULL;
    }

    // addCircles(image, root_node, parentType);
    // addRectangles(image, root_node, parentType);
    // addPaths(image, root_node, parentType);
    // addGroups(image, root_node, parentType);
    // addOtherAttributes(root_node, image->otherAttributes, parentType);

    free(parentType);
    return doc;
}

// FOR EACH OF THESE FUNCTIONS, IF THEY RETURN 1 THEN THERE IS AN ERROR AND IF THEY RETURN 0 THEN THERE IS NOT
void addTitle(xmlNodePtr root_node, SVGimage * image){
    if (strcmp(image->title, "") != 0){
        xmlNewChild(root_node, NULL, BAD_CAST "title", BAD_CAST image->title);
    }
}
void addDescription(xmlNodePtr root_node, SVGimage * image){
    if (strcmp(image->description, "") != 0){
        xmlNewChild(root_node, NULL, BAD_CAST "desc", BAD_CAST image->description);
    }
}

void addNameSpace(xmlNodePtr root_node, SVGimage * image){
    xmlNsPtr ns = xmlNewNs(root_node, (xmlChar*)image->namespace, NULL);
    xmlSetNs(root_node, ns);
}

int addRectangles(void * parent, xmlNodePtr root_node, char * parentType){
    xmlNodePtr node = NULL;
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "Rectangle");
    ListIterator itr = createIterator(getIteratingList(type, parent, parentType));
	Rectangle* data = nextElement(&itr);
	while (data != NULL)
	{
        node = xmlNewChild(root_node, NULL, BAD_CAST "rect", BAD_CAST NULL);
        // If invalid 
        if (data->x < 0 || data->y < 0 || data->width < 0 || data->height < 0 || data->otherAttributes == NULL){
            return 1;
        }
        char * x = floatToString(data->x);
        char * y = floatToString(data->y);
        char * width = floatToString(data->width);
        char * height = floatToString(data->height);
        if (strcmp(data->units, "") != 0){
            strcat(x, (char*)data->units);
        }
        xmlNewProp(node, BAD_CAST "x", BAD_CAST x);
        xmlNewProp(node, BAD_CAST "y", BAD_CAST y);
        xmlNewProp(node, BAD_CAST "width", BAD_CAST width);
        xmlNewProp(node, BAD_CAST "height", BAD_CAST height);
        free(x);
        free(y);
        free(width);
        free(height);

        if (addOtherAttributes(node, data->otherAttributes, parentType) == 1){
            return 1;
        }
        xmlAddChild(root_node, node);

		data = nextElement(&itr);
	}
    free(type);
    return 0;
}
int addPaths(void * parent, xmlNodePtr root_node, char * parentType){
    xmlNodePtr node = NULL;
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "Path");
    ListIterator itr = createIterator(getIteratingList(type, parent, parentType));
    free(type);
	Path* data = nextElement(&itr);
	while (data != NULL)
	{
        node = xmlNewChild(root_node, NULL, BAD_CAST "path", BAD_CAST NULL);
        if (data->data == NULL || data->otherAttributes == NULL){
            return 1;
        }

        xmlNewProp(node, BAD_CAST "d", BAD_CAST data->data);

        char * type = malloc(sizeof(char)*20);
        strcpy(type, "Path");

        if (addOtherAttributes(node, data->otherAttributes, parentType) == 1){
            return 1;
        }
        free(type);

        
        xmlAddChild(root_node, node);

		data = nextElement(&itr);
	}
    return 0;
}
int addCircles(void * parent, xmlNodePtr root_node, char * parentType){
    xmlNodePtr node = NULL;
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "Circle");
    ListIterator itr = createIterator(getIteratingList(type, parent, parentType));
	Circle* data = nextElement(&itr);
	while (data != NULL)
	{
        node = xmlNewChild(root_node, NULL, BAD_CAST "circle", BAD_CAST NULL);
        if (data->cx < 0 || data->cy < 0 || data->r < 0 || data->otherAttributes == NULL) {
            return 1;
        }
        char * cx = floatToString(data->cx);
        char * cy = floatToString(data->cy);
        char * r = floatToString(data->r);
        if (strcmp(data->units, "") != 0){
            strcat(cx, (char*)data->units);
        }
        xmlNewProp(node, BAD_CAST "cx", BAD_CAST cx);
        xmlNewProp(node, BAD_CAST "cy", BAD_CAST cy);
        xmlNewProp(node, BAD_CAST "r", BAD_CAST r);
        free(cx);
        free(cy);
        free(r);

        if (addOtherAttributes(node, data->otherAttributes, parentType) == 1){
            return 1;
        }
        xmlAddChild(root_node, node);

		data = nextElement(&itr);
	}
    free(type);
    return 0;
}
int addGroups(void * parent, xmlNodePtr root_node, char * parentType){
    xmlNodePtr node = NULL;
    char * type = malloc(sizeof(char)*20);
    strcpy(type, "Group");
    ListIterator itr = createIterator(getIteratingList(type, parent, parentType));
	Group* data = nextElement(&itr);
	while (data != NULL)
	{
        node = xmlNewChild(root_node, NULL, BAD_CAST "g", BAD_CAST NULL);
        if (data->circles == NULL || data->paths == NULL || data->rectangles == NULL || data->groups == NULL || data->otherAttributes == NULL){
            return 1;
        }

        addCircles(data, node, type);
        addPaths(data, node, type);
        addRectangles(data, node, type);
        addGroups(data, node, type);
        if (addOtherAttributes(node, data->otherAttributes, parentType) == 1){
            return 1;
        }

        xmlAddChild(root_node, node);

		data = nextElement(&itr);
	}
    free(type);
    return 0;
}

int addOtherAttributes(xmlNodePtr node, List * parent, char * parentType){
    if (parent == NULL){
        return 1;
    }
    ListIterator itr = createIterator(parent);
	Attribute* data = nextElement(&itr);
	while (data != NULL){
        if (data->name == NULL || data->value == NULL || data == NULL){
            return 1;
        }
        xmlNewProp(node, BAD_CAST data->name, BAD_CAST data->value);
		data = nextElement(&itr);
	}
    return 0;
}

/* ******************************* List helper functions  - MUST be implemented *************************** */

void deleteAttribute( void* data) {
	if (data == NULL){
		return;
	}
    free(((Attribute*)data)->name);
    free(((Attribute*)data)->value);
    free((Attribute*)data);
}
char* attributeToString( void* data) {
	if (data == NULL){
		return NULL;
	}

    Attribute * tmpAttr = (Attribute*)data;

    char * name = tmpAttr->name;
    char * value = tmpAttr->value;
    char * circleDescription = NULL;
    circleDescription = malloc(sizeof(char) * (strlen(name) + strlen(value))+ 100);

    strcpy(circleDescription, name);
    strcat(circleDescription, "\n");
    strcat(circleDescription, value);

    return circleDescription;
}
int compareAttributes(const void *first, const void *second) {
    return 0;
}

void deleteGroup(void* data) {
	if (data == NULL){
		return;
	}
    freeList(((Group*)data)->rectangles);
    freeList(((Group*)data)->circles);
    freeList(((Group*)data)->paths);
    freeList(((Group*)data)->groups);
    freeList(((Group*)data)->otherAttributes);
    free((Group*)data);
}
char* groupToString( void* data) {
	if (data == NULL){
        return NULL;
	}

    Group * tmpGroup = (Group*)data;
    if (tmpGroup->otherAttributes == NULL){
        return NULL;
    }

    char * circles = toString(tmpGroup->circles);
    char * rectangles = toString(tmpGroup->rectangles);
    char * paths = toString(tmpGroup->paths);
    char * groups = toString(tmpGroup->groups);
    char * otherAttributes = toString(tmpGroup->otherAttributes);
    char * groupDescription = NULL;
    groupDescription = malloc(sizeof(char)*(strlen(circles) + strlen(rectangles) + strlen(paths) + strlen(groups) + strlen(otherAttributes))+ 100);

    strcpy(groupDescription, circles);
    strcat(groupDescription, "\n");
    strcat(groupDescription, rectangles);
    strcat(groupDescription, "\n");
    strcat(groupDescription, paths);
    strcat(groupDescription, "\n");
    strcat(groupDescription, groups);
    strcat(groupDescription, "\n");
    strcat(groupDescription, otherAttributes);
    
    free(circles);
    free(rectangles);
    free(paths);
    free(groups);
    free(otherAttributes);
    return groupDescription;

}
int compareGroups(const void *first, const void *second){
    return 0;
}

void deleteRectangle(void* data) {
	if (data == NULL){
		return;
	}
    freeList(((Rectangle*)data)->otherAttributes);
    free((Rectangle*)data);
}
char* rectangleToString(void* data) {
	if (data == NULL){
		return NULL;
	}

    Rectangle * tmpRect = (Rectangle*)data;
    if (tmpRect->otherAttributes == NULL){
        return NULL;
    }

    char * x = floatToString(tmpRect->x);
    char * y = floatToString(tmpRect->y);
    char * width = floatToString(tmpRect->width);
    char * height = floatToString(tmpRect->height);

    char * tmpStr = toString(tmpRect->otherAttributes);
    char * rectDescription = NULL;
    rectDescription = malloc(sizeof(char)* (strlen(x) + strlen(y) + strlen(width) + strlen(height) + strlen(tmpRect->units)+ strlen(tmpStr))+ 100);

    strcpy(rectDescription, tmpStr);
    strcat(rectDescription, "\n");
    strcat(rectDescription, x);
    strcat(rectDescription, "\n");
    strcat(rectDescription, y);
    strcat(rectDescription, "\n");
    strcat(rectDescription, width);
    strcat(rectDescription, "\n");
    strcat(rectDescription, height);
    strcat(rectDescription, "\n");
    strcat(rectDescription, tmpRect->units);
    
    free(x);
    free(y);
    free(width);
    free(height);
    free(tmpStr);
    return rectDescription;
}
int compareRectangles(const void *first, const void *second) {
    return 0;
}

void deleteCircle(void* data) {
	if (data == NULL){
		return;
	}
    freeList(((Circle*)data)->otherAttributes);
    free((Circle*)data);
}
char* circleToString(void* data) {
	if (data == NULL){
		return NULL;
	}

    Circle * tmpCircle = (Circle*)data;
    if (tmpCircle->otherAttributes == NULL){
        return NULL;
    }

    char * cx = floatToString(tmpCircle->cx);
    char * cy = floatToString(tmpCircle->cy);
    char * r = floatToString(tmpCircle->r);

    char * tmpStr = toString(tmpCircle->otherAttributes);
    char * circleDescription = NULL;
    circleDescription = malloc(sizeof(char) * (strlen(cx) + strlen(cy) + strlen(r) + strlen(tmpCircle->units) + strlen(tmpStr)) + 100);

    strcpy(circleDescription, tmpStr);
    strcat(circleDescription, "\n");
    strcat(circleDescription, cx);
    strcat(circleDescription, "\n");
    strcat(circleDescription, cy);
    strcat(circleDescription, "\n");
    strcat(circleDescription, r);
    strcat(circleDescription, "\n");
    strcat(circleDescription, tmpCircle->units);
    
    free(cx);
    free(cy);
    free(r);
    free(tmpStr);
    return circleDescription;
}
int compareCircles(const void *first, const void *second) {
    return 0;
}

void deletePath(void* data) {
	if (data == NULL){
		return;
	}
    free(((Path*)data)->data);
    freeList(((Path*)data)->otherAttributes);
    free((Path*)data);
}

char* pathToString(void* data) {
	if (data == NULL){
		return NULL;
	}
    Path * tmpPath = (Path*)data;
    if (tmpPath->otherAttributes == NULL){
        return NULL;
    }
    char * tmpStr = NULL;
    tmpStr = toString(tmpPath->otherAttributes);
    char * pathDescription = NULL;
    pathDescription = malloc(sizeof(char)*(strlen(tmpPath->data) + strlen(tmpStr))+ 1000);
    strcpy(pathDescription, tmpStr);
    strcat(pathDescription, "\n");
    strcat(pathDescription, tmpPath->data);
    free(tmpStr);
    return pathDescription;
}
int comparePaths(const void *first, const void *second) {
    return 0;
}

/* ******************************* Other helper functions - Prototypes in "SVGParserHelper.h" *************************** */

int getNumWithArea(List * theList, char * type, void * search){
    int numWithArea = 0;

	ListIterator itr = createIterator(theList);
	void* data = nextElement(&itr);
	while (data != NULL)
	{
        if (strcmp(type, "rectangle") == 0){
            Rectangle * tmp = (Rectangle*)data;
            float *area = (float*)search;
            int calculatedArea = (int)(ceil(tmp->width*tmp->height)); 
            if (calculatedArea == *area){
                numWithArea ++;
            }
        }
        else if (strcmp(type, "circle") == 0){
            Circle * tmp = (Circle*)data;
            float *area = (float*)search;
            float pi = 3.1415926535897932384626422;
            float calculatedArea = pi * pow(tmp->r, 2);
            if (ceil(calculatedArea) == ceil(*area)){
                numWithArea ++;
            }
        }
        else if (strcmp(type, "path") == 0){
            Path * tmp = (Path*)data;
            char * pathSearch = (char*)search;
            if (strcmp(tmp->data, pathSearch) == 0){
                numWithArea++;
            }
        }
        else if (strcmp(type, "group") == 0){
            Group * tmp = (Group*)data;
            int *groupLen = (int*)search;
            int calculatedLen = getLength(tmp->circles) + getLength(tmp->groups) + getLength(tmp->rectangles) + getLength(tmp->paths);
            if (calculatedLen == *groupLen){
                numWithArea ++;
            }
        }
		data = nextElement(&itr);
	}
    free(type);

	return numWithArea;
}

int getOtherAttributesCount(char * type, List * theList){
    int count = 0;
    ListIterator itr = createIterator(theList);
	void* data = nextElement(&itr);
	while (data != NULL) {
		//operation to do for each element in list
        if (strcmp(type, "Rectangle") == 0){
            Rectangle * tmpRect = (Rectangle*)data;
            count += getLength(tmpRect->otherAttributes);
        }
        else if (strcmp(type, "Circle") == 0){
            Circle * tmpCircle = (Circle*)data;
            count += getLength(tmpCircle->otherAttributes);
        }
        else if (strcmp(type, "Path") == 0){
            Path * tmpPath = (Path*)data;
            count += getLength(tmpPath->otherAttributes);
        }
		data = nextElement(&itr);
	}
    return count;
}

void getAllOfType(char * type, List * theList, void * parent, char * parentType){
// Loops through all of the type of shape it is in the base parent list 
    ListIterator itr = createIterator(getIteratingList(type, parent, parentType));
	void* data = nextElement(&itr);
	while (data != NULL) {
		//operation to do for each element in list
        insertBack(theList, data);
		data = nextElement(&itr);
	}
// Loops through all of the type of shape in the groups list 
    if (strcmp(parentType, "SVG") == 0){
        SVGimage * tmpParent = (SVGimage*)parent;
        if (getLength(tmpParent->groups) == 0){
            return;
        }
        ListIterator groupItr = createIterator(tmpParent->groups);
        void* groupData = nextElement(&groupItr);
        while (groupData != NULL) {
            getAllOfType(type, theList, groupData, "Group");
            groupData = nextElement(&groupItr);
        }
    }
    else if (strcmp(parentType, "Group") == 0){
        Group * tmpParent = (Group*)parent;
        if (getLength(tmpParent->groups) == 0){
            return;
        }
        ListIterator groupItr = createIterator(tmpParent->groups);
        void* groupData = nextElement(&groupItr);
        while (groupData != NULL) {
            getAllOfType(type, theList, groupData, "Group");
            groupData = nextElement(&groupItr);
        }
    }
}

List * getIteratingList(char * type, void * parent, char * parentType){
    if (strcmp(parentType, "SVG") == 0){
        SVGimage * tmpParent = (SVGimage*)parent;
        if (strcmp(type, "Rectangle") == 0){
            return tmpParent->rectangles;
        }
        else if (strcmp(type, "Circle") == 0){
            return tmpParent->circles;
        }
        else if (strcmp(type, "Group") == 0){
            return tmpParent->groups;
        }
        else if (strcmp(type, "Path") == 0){
            return tmpParent->paths;
        }
        else if (strcmp(type, "Attribute") == 0){
            return tmpParent->otherAttributes;
        }
        else {
            return NULL;
        }
    }
    else if (strcmp(parentType, "Group") == 0){
        Group * tmpParent = (Group*)parent;
        if (strcmp(type, "Rectangle") == 0){
            return tmpParent->rectangles;
        }
        else if (strcmp(type, "Circle") == 0){
            return tmpParent->circles;
        }
        else if (strcmp(type, "Group") == 0){
            return tmpParent->groups;
        }
        else if (strcmp(type, "Path") == 0){
            return tmpParent->paths;
        }
        else if (strcmp(type, "Attribute") == 0){
            return tmpParent->otherAttributes;
        }
        else {
            return NULL;
        }
    }
    else {
        return NULL;
    }
}

void initializeAllLists(void * theImage, int ID) {
    // if ID == 1 will assume that void pointer is SVGimage if ID == 0, will be Group 
    List * circleList, * pathList, * rectList, * groupList, * otherAttrList;
    //Initializing all the lists using the LinkedListAPI
    circleList = initializeList(&circleToString, &deleteCircle, &compareCircles);
    pathList = initializeList(&pathToString, &deletePath, &comparePaths);
    rectList = initializeList(&rectangleToString, &deleteRectangle, &compareRectangles);
    groupList = initializeList(&groupToString, &deleteGroup, &compareGroups);
    otherAttrList = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
    //Adding all previously created Linked Lists to the image
    if (ID == 1){
        SVGimage * tmpSVG = (SVGimage*)theImage;
        strcpy(tmpSVG->namespace, "");
        strcpy(tmpSVG->title, "");
        strcpy(tmpSVG->description, "");
        tmpSVG->circles = circleList;
        tmpSVG->rectangles = rectList;
        tmpSVG->paths = pathList;
        tmpSVG->groups = groupList;
        tmpSVG->otherAttributes = otherAttrList;
    } 
    else if (ID == 0) {
        Group * tmpGroup = (Group*)theImage;
        tmpGroup->circles = circleList;
        tmpGroup->rectangles = rectList;
        tmpGroup->paths = pathList;
        tmpGroup->groups = groupList;
        tmpGroup->otherAttributes = otherAttrList;
    }
}

Attribute * createAttribute(char * attrName, char * cont){
    Attribute * anAttribute = malloc(sizeof(Attribute));
    anAttribute->name = attrName;
    anAttribute->value = cont;
    return anAttribute;
}

char * getAttrValue(xmlNode *cur_node, char * search, List * otherAttributesList){
    xmlAttr *attr;
    for (attr = cur_node->properties; attr != NULL; attr = attr->next) {
        xmlNode *value;
        value = attr->children;
        char *attrName = (char *)attr->name;
        char *cont = (char *)(value->content);

        //printf("\ttag: %s, attribute name: %s, attribute value = %s\n",(char*)cur_node->name, attrName, cont);
        if (strcmp(attrName, search) == 0) {
            return cont;
        }
        else if (strcmp((char*)cur_node->name,"circle") == 0 && strcmp(attrName,"cx") != 0 && strcmp(attrName,"cy") != 0 && strcmp(attrName,"r") != 0 && attrName != NULL && strcmp(search, "OTHERATTRIBUTES") == 0){
            int attrNameLen = xmlStrlen(attr->name)+1;
            int contLen = xmlStrlen(value->content)+1;
            attrName = malloc(sizeof(char)*attrNameLen);
            cont = malloc(sizeof(char)*contLen);

            strcpy(attrName, (char*)attr->name);
            strcpy(cont, (char*)(value->content));
            
            insertBack(otherAttributesList, createAttribute(attrName, cont));
        }
        else if (strcmp((char*)cur_node->name,"path") == 0 && strcmp(attrName,"d") != 0 && attrName != NULL && strcmp(search, "OTHERATTRIBUTES") == 0){
                
            int attrNameLen = xmlStrlen(attr->name)+1;
            int contLen = xmlStrlen(value->content)+1;
            attrName = malloc(sizeof(char)*attrNameLen);
            cont = malloc(sizeof(char)*contLen);

            strcpy(attrName, (char*)attr->name);
            strcpy(cont, (char*)(value->content));
            
            insertBack(otherAttributesList, createAttribute(attrName, cont));
        }
        else if (strcmp((char*)cur_node->name,"rect") == 0 && strcmp(attrName,"x") != 0 && strcmp(attrName,"y") != 0 && strcmp(attrName,"width") != 0 && strcmp(attrName,"height") != 0 && attrName != NULL && strcmp(search, "OTHERATTRIBUTES") == 0){

            int attrNameLen = xmlStrlen(attr->name)+1;
            int contLen = xmlStrlen(value->content)+1;
            attrName = malloc(sizeof(char)*attrNameLen);
            cont = malloc(sizeof(char)*contLen);

            strcpy(attrName, (char*)attr->name);
            strcpy(cont, (char*)(value->content));
            
            insertBack(otherAttributesList, createAttribute(attrName, cont));
        }
        else if (strcmp((char*)cur_node->name,"g") == 0 && strcmp(attrName,"rect") != 0 && strcmp(attrName,"circle") != 0 && strcmp(attrName,"path") != 0  && strcmp(attrName,"g") != 0 && attrName != NULL && strcmp(search, "OTHERATTRIBUTES") == 0){
            int attrNameLen = xmlStrlen(attr->name)+1;
            int contLen = xmlStrlen(value->content)+1;
            attrName = malloc(sizeof(char)*attrNameLen);
            cont = malloc(sizeof(char)*contLen);

            strcpy(attrName, (char*)attr->name);
            strcpy(cont, (char*)(value->content));

            insertBack(otherAttributesList, createAttribute(attrName, cont));
        }
        else if (strcmp((char*)cur_node->name,"svg") == 0 && strcmp(attrName, "xmlns") != 0 && strcmp(attrName,"rect") != 0 && strcmp(attrName,"circle") != 0 && strcmp(attrName,"path") != 0  && strcmp(attrName,"g") != 0 && attrName != NULL && strcmp(search, "OTHERATTRIBUTES") == 0) {
            int attrNameLen = xmlStrlen(attr->name)+1;
            int contLen = xmlStrlen(value->content)+1;
            attrName = malloc(sizeof(char)*attrNameLen);
            cont = malloc(sizeof(char)*contLen);

            strcpy(attrName, (char*)attr->name);
            strcpy(cont, (char*)(value->content));

            insertBack(otherAttributesList, createAttribute(attrName, cont));
        }
    }
    return NULL;
}

float toFloat(char * string) {
    if (string == NULL){
        return 0;
    }
    char *ptr;
    return strtod(string, &ptr);
    //return (float)strtod(string, NULL);
}

char * getUnits(char * string){
    if (string == NULL){
        return NULL;
    }
    char *ptr;
    strtod(string, &ptr);
    return ptr;
}

char * floatToString(float aFloat){
    char * tmp = NULL;
    tmp = malloc(sizeof(char)*256);
    sprintf(tmp, "%f", aFloat);
    return tmp;
}

void allocateForCircle(xmlNode *cur_node, void * parent, int ID){
    // If ID == 1 then it will be added to SVGImage, if ID == 0 then it will be added to a group
    Circle* aCircle;
    aCircle = malloc(sizeof(Circle));
    List * otherAttributesCircle = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
    char * cx = getAttrValue(cur_node, "cx", otherAttributesCircle);
    int cxValid = 0;
    char * cy = getAttrValue(cur_node, "cy", otherAttributesCircle);
    int cyValid = 0;
    char * r = getAttrValue(cur_node, "r", otherAttributesCircle);
    int rValid = 0;
    if (cx == NULL) {
        cxValid = 1;
        aCircle->cx = 0;
    }
    else {
        aCircle->cx = toFloat(cx);
    }
    if (cy == NULL) {
        cyValid = 1;
        aCircle->cy = 0;
    }
    else {
        aCircle->cy = toFloat(cy);
    }
    if (r == NULL) {
        rValid = 1;
        aCircle->r = 0;
    }
    else {
        aCircle->r = toFloat(r);
    }

    if (rValid != 1 && strcmp(getUnits(r), "") != 0){
        strcpy(aCircle->units, getUnits(r));
    }
    else if (cxValid != 1 && strcmp(getUnits(cx), "") != 0){
        strcpy(aCircle->units, getUnits(cx));
    }
    else if (cyValid != 1 && strcmp(getUnits(cy), "") != 0){
        strcpy(aCircle->units, getUnits(cy));
    }
    else {
        strcpy(aCircle->units, "");
    }
    getAttrValue(cur_node, "OTHERATTRIBUTES", otherAttributesCircle);
    aCircle->otherAttributes = otherAttributesCircle;


    if (ID == 1){
        SVGimage * tmpImage = (SVGimage*)parent; 
        insertBack(tmpImage->circles, aCircle);
    }
    else if (ID == 0){
        Group * tmpGroup = (Group*)parent;
        insertBack(tmpGroup->circles, aCircle);
    }
}

void allocateForPath(xmlNode *cur_node, void * parent, int ID){
    // If ID == 1 then it will be added to SVGImage, if ID == 0 then it will be added to a group
    Path * aPath = malloc(sizeof(Path));
    List * otherAttributesPath = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);

    char * tmpData = getAttrValue(cur_node, "d", otherAttributesPath);
    if (tmpData == NULL){
        aPath->data = malloc(sizeof(char) * 10);
        strncpy(aPath->data, "No data", 10);
    }
    else {
        aPath->data = NULL; 
        aPath->data = malloc(sizeof(char)*strlen(tmpData)+100);
        strcpy(aPath->data, tmpData);
    }
    
    getAttrValue(cur_node, "OTHERATTRIBUTES", otherAttributesPath);
    aPath->otherAttributes = otherAttributesPath;
    
    if (ID == 1){
        SVGimage * tmpImage = (SVGimage*)parent; 
        insertBack(tmpImage->paths, aPath);
    }
    else if (ID == 0){
        Group * tmpGroup = (Group*)parent;
        insertBack(tmpGroup->paths, aPath);
    }
    
}

void allocateForRectangle(xmlNode *cur_node, void * parent, int ID){
    // If ID == 1 then it will be added to SVGImage, if ID == 0 then it will be added to a group

    Rectangle *aRect = malloc(sizeof(Rectangle));
    List * otherAttributesRect = initializeList(&attributeToString, &deleteAttribute, &compareAttributes);
    char * x = getAttrValue(cur_node, "x", otherAttributesRect);
    int xValid = 0;
    char * y = getAttrValue(cur_node, "y", otherAttributesRect);
    int yValid = 0;
    char * width = getAttrValue(cur_node, "width", otherAttributesRect);
    int widthValid = 0;
    char * height = getAttrValue(cur_node, "height", otherAttributesRect);
    int heightValid = 0;
    if (x == NULL) {
        xValid = 1;
        aRect->x = 0;
    }
    else {
        aRect->x = toFloat(x);
    }
    if (y == NULL) {
        yValid = 1;
        aRect->y = 0;
    }
    else {
        aRect->y = toFloat(y);
    }
    if (width == NULL) {
        widthValid = 1;
        aRect->width = 0;
    }
    else {
        aRect->width = toFloat(width);
    }
    if (height == NULL) {
        heightValid = 1;
        aRect->height = 0;
    }
    else {
        aRect->height = toFloat(height);
    }

    if (xValid != 1 && strcmp(getUnits(x), "") != 0){
        strcpy(aRect->units, getUnits(x));
    }
    else if (yValid != 1 && strcmp(getUnits(y), "") != 0){
        strcpy(aRect->units, getUnits(y));
    }
    else if (widthValid != 1 && strcmp(getUnits(width), "") != 0){
        strcpy(aRect->units, getUnits(width));
    }
    else if (heightValid != 1 && strcmp(getUnits(height), "") != 0){
        strcpy(aRect->units, getUnits(height));
    }
    else {
        strcpy(aRect->units,"");
    }

    getAttrValue(cur_node, "OTHERATTRIBUTES", otherAttributesRect);
    aRect->otherAttributes = otherAttributesRect;

    if (ID == 1){
        SVGimage * tmpImage = (SVGimage*)parent; 
        insertBack(tmpImage->rectangles, aRect);
    }
    else if (ID == 0){
        Group * tmpGroup = (Group*)parent;
        insertBack(tmpGroup->rectangles, aRect);
    }
}

void allocateForSVG(xmlNode *cur_node, SVGimage * theSVGimage){
    strncpy(theSVGimage->namespace, (char*)cur_node->nsDef->href, 255);
    getAttrValue(cur_node, "OTHERATTRIBUTES", theSVGimage->otherAttributes);
}

xmlDoc * parseTree(char * filename){
    xmlDoc *doc = NULL;

    /*
     * this initialize the library and check potential ABI mismatches
     * between the version it was compiled for and the actual shared
     * library used.
     */
    LIBXML_TEST_VERSION

    /*parse the file and get the DOM */
    doc = xmlReadFile(filename, NULL, 0);

    if (doc == NULL) {
        // printf("error: could not parse file %s\n", filename);
        return NULL;
    }

    return doc;
}

void allocateForGroup(xmlNode *cur_node, void * parent, int ID) {
    // If ID == 1 then it will be added to SVGImage, if ID == 0 then it will be added to a group
    Group * aGroup = malloc(sizeof(Group));
    initializeAllLists(aGroup, 0);
    traverseGroupTree(cur_node, aGroup);

    getAttrValue(cur_node, "OTHERATTRIBUTES", aGroup->otherAttributes);

    if (ID == 1){
        SVGimage * tmpImage = (SVGimage*)parent; 
        insertBack(tmpImage->groups, aGroup);
    }
    else if (ID == 0){
        Group * tmpGroup = (Group*)parent;
        insertBack(tmpGroup->groups, aGroup);
    }
}

// Returns 0 if successful and -1 if unsuccesful
int allocateForType(xmlNode *cur_node, void * parent, int ID){
    // if ID == 1 will assume that void pointer is SVGimage if ID == 0, will be Group 
    char * name = (char*)cur_node->name;
    if (strcmp(name, "title") == 0){
        SVGimage * tmpSVG = (SVGimage*)parent;
        if (cur_node->children->content != NULL){
            // strcpy(tmpSVG->title, (char*)cur_node->children->content);
            strncpy(tmpSVG->title, (char*)cur_node->children->content, 255);
        }
        else {
            strcpy(tmpSVG->title, "");
        }
        return 0;
    }
    else if (strcmp(name, "desc") == 0){
        SVGimage * tmpSVG = (SVGimage*)parent; 
        if (cur_node->children->content != NULL){
            // strcpy(tmpSVG->description, (char*)cur_node->children->content);
            strncpy(tmpSVG->description, (char*)cur_node->children->content, 255);
        }
        else {
            strcpy(tmpSVG->description, "");
        }
        return 0;

    }
    else if (strcmp(name,"circle") == 0 && ID == 1) {
        SVGimage * tmpSVG = (SVGimage*)parent;
        allocateForCircle(cur_node, tmpSVG, ID);
        return 0;
    }
    else if (strcmp(name,"circle") == 0 && ID == 0) {
        Group * tmpGroup = (Group*)parent;
        allocateForCircle(cur_node, tmpGroup, ID);
        return 0;
    }
    else if (strcmp(name,"path") == 0 && ID == 1) {
        SVGimage * tmpSVG = (SVGimage*)parent;
        allocateForPath(cur_node, tmpSVG, ID);
        return 0;
    }
    else if (strcmp(name,"path") == 0 && ID == 0) {
        Group * tmpGroup = (Group*)parent;
        allocateForPath(cur_node, tmpGroup, ID);
        return 0;
    }
    else if (strcmp(name,"rect") == 0 && ID == 1) {
        SVGimage * tmpSVG = (SVGimage*)parent;
        allocateForRectangle(cur_node, tmpSVG, ID);
        return 0;
    }
    else if (strcmp(name,"rect") == 0 && ID == 0) {
        Group * tmpGroup = (Group*)parent;
        allocateForRectangle(cur_node, tmpGroup, ID);
        return 0;
    }
    else if (strcmp(name,"g") == 0 && ID == 1) {
        SVGimage * tmpSVG = (SVGimage*)parent;
        allocateForGroup(cur_node, tmpSVG, ID);
        return 0;
    }
    else if (strcmp(name,"g") == 0 && ID == 0) {
        Group * tmpGroup = (Group*)parent;
        allocateForGroup(cur_node, tmpGroup, ID);
        return 0;
    }
    else {
        return -1;
    }   
    return -1;
}

// Returns 0 if successful and -1 if unsuccesful
int traverseSVGTree(xmlNode * a_node, SVGimage * theSVGimage, xmlNode * rootElement)
{
    xmlNode *cur_node = NULL;
    int allocateTypeSuccessful = 0;
    int toReturn = 0;

    for (cur_node = a_node; cur_node != NULL; cur_node = cur_node->next) {
        //printf("cur_node->name: %s\n", (char*)cur_node->name);

        if (strcmp((char*)cur_node->name, "svg") == 0){
            allocateForSVG(cur_node, theSVGimage);
        }
        //if (cur_node->type == XML_ELEMENT_NODE) {
        //printf("Current parent line: %d || Root Element parente line: %d\n",(int)((cur_node->parent)->line), (int)(rootElement->line) );
        // To improve: Should find a better way to compare two xmlNodes
        if (cur_node->type == XML_ELEMENT_NODE && (int)((cur_node->parent)->line) == (int)(rootElement->line) ) {
            // printf("Node: %s\n", (char*)cur_node->name);
            allocateTypeSuccessful = allocateForType(cur_node, theSVGimage, 1);
            if (allocateTypeSuccessful == -1){
                toReturn = -1;
                return toReturn;
                // break;
            }
            // printf("%s\n", cur_node->name);
        }
        traverseSVGTree(cur_node->children, theSVGimage, rootElement);
    }
    return toReturn;
}

static void
traverseGroupTree(xmlNode * a_node, Group * aGroup)
{
    xmlNode *cur_node = NULL;
    
    cur_node = a_node;
    xmlNode *lastInGroup = cur_node->last;
    int lastLine = lastInGroup->line;

    cur_node = cur_node->children;
    
    for (; (int)(cur_node->line) != lastLine; cur_node = cur_node->next){
        if (cur_node->type == XML_ELEMENT_NODE) {
            allocateForType(cur_node, aGroup, 0);
        }
    }
}


void clearListRevised(List* list){	
    if (list == NULL){
		return;
	}
	if (list->head == NULL && list->tail == NULL){
		return;
	}
	
	Node* tmp;
	while (list->head != NULL){
		// list->deleteData(list->head->data);
		tmp = list->head;
		list->head = list->head->next;
		free(tmp);
	}
	
	list->head = NULL;
	list->tail = NULL;
	list->length = 0;
}
