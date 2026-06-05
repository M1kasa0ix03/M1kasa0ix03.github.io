#include<iostream>
#include<string>
using namespace std;

void  readPapers(const string & s1 ){
    int pcnt = 0;
    int scnt = 0;
    size_t n =s1.size();
    for(int i = 0 ;i < n;++i){
        if(s1[i] == '.'|| s1[i] == ','|| s1[i] == '"'){
            pcnt++;
        }if(s1[i] == ' '){
            scnt++;
        }
    }
    cout<<scnt<<","<<pcnt;
}
int main() {
    std::string content;
    std::getline(std::cin, content, '\n');
    readPapers(content);
    return 0;
}