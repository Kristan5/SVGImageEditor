/*
Name:           Kristan Samaroo
Student ID:     1045594
Email:          ksamaroo@uoguelph.ca

*/

#include <math.h>

void initializeAllLists(void * theImage, int ID);

Attribute * createAttribute(char * attrName, char * cont);

char * getAttrValue(xmlNode *cur_node, char * search, List * otherAttributesList);

float toFloat(char * string);

char * floatToString(float aFloat);

void allocateForCircle(xmlNode *cur_node, void * parent, int ID);
void allocateForPath(xmlNode *cur_node, void * parent, int ID);
void allocateForRectangle(xmlNode *cur_node, void * parent, int ID);
void allocateForSVG(xmlNode *cur_node, SVGimage * theSVGimage);

xmlDoc * parseTree(char * filename);

static void traverseGroupTree(xmlNode * a_node, Group * aGroup);

void allocateForGroup(xmlNode *cur_node, void * parent, int ID);

int allocateForType(xmlNode *cur_node, void * parent, int ID);
// void allocateForType(xmlNode *cur_node, void * parent, int ID);

int traverseSVGTree(xmlNode * a_node, SVGimage * theSVGimage, xmlNode * rootElement);
// static void traverseSVGTree(xmlNode * a_node, SVGimage * theSVGimage, xmlNode * rootElement);

int getNumWithArea(List * theList, char * type, void * search);

void getAllOfType(char * type, List * theList, void * parent, char * parentType);

List * getIteratingList(char * type, void * parent, char * parentType);

int getOtherAttributesCount(char * type, List * theList);

void clearListRevised(List* list);

/* ****************************************Assignment2****************************************************** */
int addRectangles(void * parent, xmlNodePtr root_node, char * parentType);
int addCircles(void * parent, xmlNodePtr root_node, char * parentType);
int addPaths(void * theImage, xmlNodePtr root_node, char * parentType);
int addGroups(void * parent, xmlNodePtr root_node, char * parentType);
int addOtherAttributes(xmlNodePtr node, List * parent, char * parentType);
void addNameSpace(xmlNodePtr root_node, SVGimage * image);
void addTitle(xmlNodePtr root_node, SVGimage * image);
void addDescription(xmlNodePtr root_node, SVGimage * image);

xmlDocPtr createDoc(SVGimage * image);
void freeSchema(xmlSchemaPtr schema);

void setAttributeForCircle(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute);
void setAttributeForRectangle(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute);
void setAttributeForPath(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute);
void setAttributeForGroup(SVGimage* image, elementType elemType, int elemIndex, Attribute* newAttribute);
void setOtherAttributes(Attribute* newAttribute, List * otherAttributesList);
int validAttribute(Attribute* newAttribute);

/* ****************************************Assignment3****************************************************** */

char * SVGFileToJson(char * filename, char * schema);
char * getSVGFileTitle(char * filename, char * schema);
char * getSVGFileDescription(char * filename, char * schema);

char * getSVGFileRectList(char * filename, char * schema);
char * getSVGFilePathList(char * filename, char * schema);
char * getSVGFileCircleList(char * filename, char * schema);
char * getSVGFileGroupList(char * filename, char * schema);

char * getAttrList(char * shape, char * index, char * filename, char * schema);

char * setDescription(char * newDescription, char * filename, char * schema);
char * setTitle(char * newTitle, char * filename, char * schema);

char * updateAttribute(char * shape, char * index, char * attributeName, char * newValue, char * filename, char * schema);

char * createNewSVGFile(char * filename, char * title, char * description);

char * createCircle(char * cx, char * cy, char * r, char * units, char * fill, char * filename, char * schema);
char * createRectangle(char * x, char * y, char * w, char * h, char * units, char * fill, char * filename, char * schema);

char * scaleRectangles(char * factor, char * filename, char * schema);
char * scaleCircles(char * factor, char * filename, char * schema);